/**
 * Gera sp-bairros.geojson combinando:
 * 1. Polígonos reais do OSM via Nominatim (para os que existem)
 * 2. Polígonos aproximados manuais baseados nos limites reais de SP (para os que faltam)
 */
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "sp-bairros.geojson");

// Bairros a buscar via Nominatim (estes têm polígonos no OSM)
const OSM_BAIRROS = [
  "Vila Leopoldina", "Lapa", "Perdizes", "Jaguaré", "Sumaré",
  "Itaberaba", "Parque da Lapa", "Bom Retiro", "Jaraguá",
  "Alto de Pinheiros", "Pinheiros", "Alto da Lapa", "Vila Olímpia", "Aclimação",
  "Parque São Domingos", "Barra Funda", "Imirim", "Vila Madalena",
];

/**
 * Polígonos aproximados para bairros sem dados no OSM.
 * Coordenadas baseadas nos limites viários/geográficos reais de SP.
 * Formato GeoJSON: [lon, lat]
 */
const MANUAL_POLIGONOS = {
  // Vila Romana: entre Av. Gastão Vidigal (O), Av. Pompéia (L),
  // Rio Tietê (N), R. Cardoso de Almeida (S)
  "Vila Romana": [
    [-46.7120, -23.5105], [-46.6790, -23.5105],
    [-46.6790, -23.5330], [-46.7120, -23.5330],
    [-46.7120, -23.5105],
  ],
  // Água Branca: entre Marginal Tietê (N), Barra Funda (L),
  // Lapa (O), Av. São João (S)
  "Água Branca": [
    [-46.6990, -23.5000], [-46.6640, -23.5000],
    [-46.6640, -23.5185], [-46.6990, -23.5185],
    [-46.6990, -23.5000],
  ],
  // Vila Anastácio: a oeste da Lapa, entre R. Imperatriz Leopoldina
  // e a Vila Leopoldina
  "Vila Anastácio": [
    [-46.7380, -23.5040], [-46.7070, -23.5040],
    [-46.7070, -23.5310], [-46.7380, -23.5310],
    [-46.7380, -23.5040],
  ],
  // Vila Ipojuca: entre Vila Anastácio e a parte sul da Lapa
  "Vila Ipojuca": [
    [-46.7300, -23.5200], [-46.7010, -23.5200],
    [-46.7010, -23.5440], [-46.7300, -23.5440],
    [-46.7300, -23.5200],
  ],
  // Vila Pompéia: entre Perdizes e Vila Madalena,
  // R. Cardoso de Almeida (N) e Av. Sumaré (S)
  "Vila Pompéia": [
    [-46.6940, -23.5295], [-46.6660, -23.5295],
    [-46.6660, -23.5540], [-46.6940, -23.5540],
    [-46.6940, -23.5295],
  ],
  // Lapa de Baixo: corredor próximo ao Rio Tietê, entre Lapa e Barra Funda
  "Lapa de Baixo": [
    [-46.7050, -23.5080], [-46.6930, -23.5080],
    [-46.6930, -23.5200], [-46.7050, -23.5200],
    [-46.7050, -23.5080],
  ],
  // Siciliano: bairro ao sul de Vila Romana, próx. a Pompéia e Lapa
  "Siciliano": [
    [-46.7000, -23.5260], [-46.6830, -23.5260],
    [-46.6830, -23.5380], [-46.7000, -23.5380],
    [-46.7000, -23.5260],
  ],
  // City América: entre Lapa e Vila Anastácio
  "City América": [
    [-46.7180, -23.5080], [-46.7060, -23.5080],
    [-46.7060, -23.5200], [-46.7180, -23.5200],
    [-46.7180, -23.5080],
  ],
  // Parque Residencial da Lapa
  "Parque Residencial da Lapa": [
    [-46.7270, -23.5025], [-46.7130, -23.5025],
    [-46.7130, -23.5120], [-46.7270, -23.5120],
    [-46.7270, -23.5025],
  ],
  // Sumarezinho: próx. à Sumaré, entre Perdizes e Vila Madalena
  "Sumarezinho": [
    [-46.6850, -23.5390], [-46.6710, -23.5390],
    [-46.6710, -23.5520], [-46.6850, -23.5520],
    [-46.6850, -23.5390],
  ],
  // Piqueri: zona norte de SP, Pirituba
  "Piqueri": [
    [-46.7210, -23.4990], [-46.7010, -23.4990],
    [-46.7010, -23.5140], [-46.7210, -23.5140],
    [-46.7210, -23.4990],
  ],
  // Bela Aliança: entre Lapa e City América
  "Bela Aliança": [
    [-46.7200, -23.5140], [-46.7060, -23.5140],
    [-46.7060, -23.5230], [-46.7200, -23.5230],
    [-46.7200, -23.5140],
  ],
  // Vila Anglo Brasileira
  "Vila Anglo Brasileira": [
    [-46.6950, -23.5390], [-46.6830, -23.5390],
    [-46.6830, -23.5480], [-46.6950, -23.5480],
    [-46.6950, -23.5390],
  ],
};

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { "User-Agent": "mapa-modulo/1.0 (silvaygormatos@gmail.com)" }
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchNominatim(nome) {
  const q = encodeURIComponent(`${nome}, São Paulo, SP, Brasil`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=geojson&polygon_geojson=1&limit=3&accept-language=pt&countrycodes=br`;
  const raw = await get(url);
  const data = JSON.parse(raw);
  for (const f of data.features) {
    if (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon") {
      return { type: "Feature", geometry: f.geometry, properties: { name: nome } };
    }
  }
  return null;
}

async function main() {
  const features = [];

  // 1. Buscar polígonos reais do OSM
  console.log("=== Buscando polígonos OSM via Nominatim ===");
  for (const nome of OSM_BAIRROS) {
    await sleep(1300);
    try {
      const feat = await fetchNominatim(nome);
      if (feat) { features.push(feat); console.log(`OK  ${nome}`); }
      else console.log(`--- ${nome} (sem polígono no OSM)`);
    } catch (e) {
      console.log(`ERR ${nome}: ${e.message}`);
    }
  }

  // 2. Adicionar polígonos manuais
  console.log("\n=== Adicionando polígonos aproximados ===");
  for (const [nome, coords] of Object.entries(MANUAL_POLIGONOS)) {
    // Só adiciona se não tiver polígono OSM
    if (!features.find(f => f.properties.name === nome)) {
      features.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties: { name: nome, aprox: true },
      });
      console.log(`~   ${nome} (aproximado)`);
    } else {
      console.log(`SKP ${nome} (já tem OSM)`);
    }
  }

  const geojson = { type: "FeatureCollection", features };
  fs.writeFileSync(OUT, JSON.stringify(geojson), "utf8");
  console.log(`\nTotal: ${features.length} features → ${OUT}`);
}

main().catch(console.error);
