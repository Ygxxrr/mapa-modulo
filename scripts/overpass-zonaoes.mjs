import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "sp-bairros.geojson");

// Bounding box: SP Zona Oeste + centro (onde 90% dos alunos estão)
// sul, oeste, norte, leste
const BBOX = "-23.62,-46.82,-23.40,-46.57";

const QUERY = `
[out:json][timeout:120];
(
  relation["admin_level"="10"]["boundary"="administrative"](${BBOX});
  relation["place"~"suburb|neighbourhood|quarter"]["name"](${BBOX});
);
out geom;
`;

// Mapeamento nome planilha → nome OSM esperado (normalizado)
const BAIRROS_PLANILHA = {
  "Vila Leopoldina": ["Vila Leopoldina"],
  "Vila Romana": ["Vila Romana"],
  "Vila Ipojuca": ["Vila Ipojuca"],
  "Lapa": ["Lapa"],
  "Água Branca": ["Água Branca", "Agua Branca"],
  "Vila Anastácio": ["Vila Anastácio", "Vila Anastacio"],
  "Perdizes": ["Perdizes"],
  "Vila Pompéia": ["Vila Pompéia", "Vila Pompeia"],
  "Lapa de Baixo": ["Lapa de Baixo"],
  "Alto da Lapa": ["Alto da Lapa"],
  "Jardim Íris": ["Jardim Íris", "Jardim Iris"],
  "Parque São Domingos": ["Parque São Domingos"],
  "Barra Funda": ["Barra Funda"],
  "Jaguaré": ["Jaguaré", "Jaguare"],
  "City América": ["City América", "City America"],
  "Siciliano": ["Siciliano"],
  "Pinheiros": ["Pinheiros"],
  "Vila Madalena": ["Vila Madalena"],
  "Sumaré": ["Sumaré", "Sumare"],
  "Piqueri": ["Piqueri"],
  "Sumarezinho": ["Sumarezinho"],
  "Bela Aliança": ["Bela Aliança"],
  "Bom Retiro": ["Bom Retiro"],
  "Alto de Pinheiros": ["Alto de Pinheiros"],
  "Itaberaba": ["Itaberaba"],
  "Jaraguá": ["Jaraguá", "Jaragua"],
  "Vila Olímpia": ["Vila Olímpia", "Vila Olimpia"],
  "Aclimação": ["Aclimação", "Aclamacao"],
  "Imirim": ["Imirim"],
  "Vila Albertina": ["Vila Albertina"],
  "Vila Anglo Brasileira": ["Vila Anglo Brasileira"],
  "Boaçava": ["Boaçava", "Boacava"],
  "Parque da Lapa": ["Parque da Lapa"],
};

// Inverso: todos os nomes OSM → nome planilha
const OSM_TO_PLANILHA = {};
for (const [p, osms] of Object.entries(BAIRROS_PLANILHA)) {
  for (const o of osms) {
    OSM_TO_PLANILHA[o.toLowerCase().trim()] = p;
  }
}

function get(url, postData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: postData ? "POST" : "GET",
      headers: {
        "User-Agent": "mapa-modulo/1.0",
        "Content-Type": postData ? "application/x-www-form-urlencoded" : undefined,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error("timeout")); });
    if (postData) req.write(postData);
    req.end();
  });
}

function joinWays(ways) {
  if (!ways.length) return null;
  const segs = ways.map((w) => (w.geometry || []).map((n) => [n.lon, n.lat])).filter(s => s.length >= 2);
  if (!segs.length) return null;
  const ring = [...segs[0]];
  const used = new Set([0]);
  let changed = true;
  while (changed && used.size < segs.length) {
    changed = false;
    const last = ring[ring.length - 1];
    const first = ring[0];
    for (let i = 0; i < segs.length; i++) {
      if (used.has(i)) continue;
      const s = segs[i];
      const sf = s[0], sl = s[s.length - 1];
      const eps = 0.00005;
      const eq = (a, b) => Math.abs(a[0]-b[0]) < eps && Math.abs(a[1]-b[1]) < eps;
      if (eq(last, sf)) { ring.push(...s.slice(1)); used.add(i); changed = true; break; }
      if (eq(last, sl)) { ring.push(...[...s].reverse().slice(1)); used.add(i); changed = true; break; }
      if (eq(first, sl)) { ring.unshift(...s.slice(0, -1)); used.add(i); changed = true; break; }
      if (eq(first, sf)) { ring.unshift(...[...s].reverse().slice(0, -1)); used.add(i); changed = true; break; }
    }
  }
  if (ring.length < 4) return null;
  if (ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1]) ring.push(ring[0]);
  return ring;
}

function relationToFeature(el, nome) {
  const outers = (el.members || []).filter(m => m.role === "outer" && m.geometry);
  const inners = (el.members || []).filter(m => m.role === "inner" && m.geometry);
  const outerRing = joinWays(outers);
  if (!outerRing || outerRing.length < 4) return null;
  const rings = [outerRing];
  if (inners.length) {
    const innerRing = joinWays(inners);
    if (innerRing && innerRing.length >= 4) rings.push(innerRing);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: rings },
    properties: { name: nome },
  };
}

async function main() {
  console.log("Consultando Overpass API (bbox SP)...");
  const body = "data=" + encodeURIComponent(QUERY);
  const raw = await get("https://overpass-api.de/api/interpreter", body);
  const data = JSON.parse(raw);
  console.log(`Elementos retornados: ${data.elements.length}`);

  const features = [];
  const matched = new Set();

  for (const el of data.elements) {
    if (el.type !== "relation" || !el.tags) continue;
    const nomesOSM = [el.tags.name, el.tags["name:pt"]].filter(Boolean);
    for (const nomeOSM of nomesOSM) {
      const key = nomeOSM.toLowerCase().trim();
      const nomePlanilha = OSM_TO_PLANILHA[key];
      if (nomePlanilha && !matched.has(nomePlanilha)) {
        const feat = relationToFeature(el, nomePlanilha);
        if (feat) {
          features.push(feat);
          matched.add(nomePlanilha);
          console.log(`✓ ${nomePlanilha} (OSM id=${el.id}, admin_level=${el.tags.admin_level || el.tags.place})`);
        }
      }
    }
  }

  console.log(`\nTotal com polígono: ${features.length}`);
  const sem = Object.keys(BAIRROS_PLANILHA).filter(n => !matched.has(n));
  if (sem.length) console.log(`Sem polígono: ${sem.join(", ")}`);

  fs.writeFileSync(OUT, JSON.stringify({ type: "FeatureCollection", features }), "utf8");
  console.log(`Salvo: ${OUT}`);
}

main().catch(console.error);
