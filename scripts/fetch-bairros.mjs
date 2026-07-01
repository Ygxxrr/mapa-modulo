import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "sp-bairros.geojson");

// Bairros do dataset com seus nomes canonicos para busca OSM
const BAIRROS = [
  "Vila Leopoldina","Vila Romana","Vila Ipojuca","Lapa","Água Branca",
  "Vila Anastácio","Perdizes","Vila Pompéia","Lapa de Baixo","Alto da Lapa",
  "Jardim Íris","Parque São Domingos","Barra Funda","Jaguaré","City América",
  "Siciliano","Pinheiros","Vila Madalena","Sumaré","Piqueri",
  "Sumarezinho","Bela Aliança","Bom Retiro","Alto de Pinheiros",
  "Itaberaba","Jaraguá","Vila Olímpia","Aclimação","Imirim",
  "Vila Albertina","Vila Anglo Brasileira","Boaçava","Parque da Lapa",
];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "mapa-modulo-colegio/1.0 (silvaygormatos@gmail.com)",
        "Accept": "application/json",
      }
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Ordena e une os ways de uma relação em anéis de coordenadas
function buildRings(members) {
  const outer = members.filter((m) => m.role === "outer" && m.geometry);
  const inner = members.filter((m) => m.role === "inner" && m.geometry);

  function joinWays(ways) {
    if (!ways.length) return null;
    // Converter cada way em lista de [lon, lat]
    const segments = ways.map((w) => w.geometry.map((n) => [n.lon, n.lat]));
    const ring = [...segments[0]];
    const used = new Set([0]);
    while (used.size < segments.length) {
      const last = ring[ring.length - 1];
      let joined = false;
      for (let i = 0; i < segments.length; i++) {
        if (used.has(i)) continue;
        const seg = segments[i];
        const first = seg[0];
        const lastSeg = seg[seg.length - 1];
        if (Math.abs(last[0] - first[0]) < 0.00001 && Math.abs(last[1] - first[1]) < 0.00001) {
          ring.push(...seg.slice(1));
          used.add(i);
          joined = true;
          break;
        }
        if (Math.abs(last[0] - lastSeg[0]) < 0.00001 && Math.abs(last[1] - lastSeg[1]) < 0.00001) {
          ring.push(...[...seg].reverse().slice(1));
          used.add(i);
          joined = true;
          break;
        }
      }
      if (!joined) break;
    }
    // Fechar o anel
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push(ring[0]);
    }
    return ring;
  }

  const outerRing = joinWays(outer);
  if (!outerRing || outerRing.length < 4) return null;

  const rings = [outerRing];
  const innerRing = joinWays(inner);
  if (innerRing && innerRing.length >= 4) rings.push(innerRing);

  return rings;
}

async function fetchNominatim(nome) {
  const q = encodeURIComponent(`${nome}, São Paulo, SP, Brasil`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=geojson&polygon_geojson=1&limit=3&accept-language=pt&countrycodes=br`;
  const raw = await get(url);
  const data = JSON.parse(raw);
  for (const f of data.features) {
    if (f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")) {
      return { type: "Feature", geometry: f.geometry, properties: { name: nome } };
    }
  }
  return null;
}

async function fetchOverpass(nome) {
  const escaped = nome.replace(/"/g, '\\"');
  const query = `[out:json][timeout:30];area[name="São Paulo"][admin_level="8"]->.sp;(relation["name"="${escaped}"]["place"~"suburb|neighbourhood|quarter"](area.sp);relation["name"="${escaped}"]["admin_level"~"^(9|10)$"](area.sp););out geom;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const raw = await get(url);
  const data = JSON.parse(raw);
  for (const el of data.elements || []) {
    if (el.type === "relation" && el.members) {
      const rings = buildRings(el.members);
      if (rings) {
        return {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: rings },
          properties: { name: nome }
        };
      }
    }
  }
  return null;
}

async function main() {
  const features = [];
  for (const nome of BAIRROS) {
    await sleep(1200);
    let feat = await fetchNominatim(nome).catch(() => null);
    if (!feat) {
      await sleep(1000);
      feat = await fetchOverpass(nome).catch(() => null);
    }
    if (feat) {
      features.push(feat);
      console.log(`OK  ${nome}`);
    } else {
      console.log(`--- ${nome}`);
    }
  }

  const geojson = { type: "FeatureCollection", features };
  fs.writeFileSync(OUT, JSON.stringify(geojson), "utf8");
  console.log(`\nSalvo: ${features.length}/${BAIRROS.length} polígonos em ${OUT}`);
}

main().catch(console.error);
