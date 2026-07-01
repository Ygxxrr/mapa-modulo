import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "sp-bairros.geojson");

// Bairros da planilha com contagem de alunos
const ALUNOS = {
  "Vila Leopoldina": 32, "Vila Romana": 28, "Vila Ipojuca": 26,
  "Lapa": 24, "Água Branca": 21, "Vila Anastácio": 15,
  "Perdizes": 14, "Vila Pompéia": 12, "Lapa de Baixo": 7,
  "Alto da Lapa": 6, "Jardim Íris": 5, "Parque São Domingos": 4,
  "Barra Funda": 3, "Jaguaré": 3, "City América": 3,
  "Parque Residencial da Lapa": 3, "Siciliano": 3,
  "Jardim Felicidade (Zona Oeste)": 2, "Pinheiros": 2, "Vila Madalena": 2,
  "Vila Progredior": 2, "Parque dos Lima": 2, "Sumaré": 2,
  "Piqueri": 2, "Vila Albertina": 2, "Bela Aliança": 2,
  "Jardim Britânia": 2, "Sumarezinho": 2, "Vila Anglo Brasileira": 2,
  "Jardim Marilu": 2, "Jardim São João (Jaraguá)": 2,
  "Vila Mirante": 1, "Itaberaba": 1, "Vila São Vicente": 1,
  "Várzea da Barra Funda": 1, "Jardim Mangalot": 1, "Jaraguá": 1,
  "Parque da Lapa": 1, "Bom Retiro": 1, "Parque Maria Domitila": 1,
  "Boaçava": 1, "Alto de Pinheiros": 1, "Jardim Cidade Pirituba": 1,
  "Jardim Luíza (Fazendinha)": 1, "Vila Mangalot": 1, "Vila Primavera": 1,
  "Aclimação": 1, "Imirim": 1, "Vila Marina": 1,
  "Vila Olímpia": 1, "Vila Carmosina": 1, "Jardim Paulistano (Zona Norte)": 1,
  "Vila Amélia": 1, "Jardim Santa Mônica": 1, "Jardim São José (Zona Norte)": 1,
  "Vila Bonilha": 1,
};

// Buscar lista completa dos 96 distritos de SP
async function getDistritos() {
  return new Promise((resolve, reject) => {
    https.get("https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3550308/distritos",
      { headers: { "User-Agent": "mapa-modulo/1.0" } },
      (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve(JSON.parse(d)));
        res.on("error", reject);
      }
    ).on("error", reject);
  });
}

// Buscar GeoJSON de todos os distritos do estado SP (resolucao=5)
async function getMalha() {
  return new Promise((resolve, reject) => {
    https.get(
      "https://servicodados.ibge.gov.br/api/v3/malhas/estados/35?resolucao=5&formato=application/vnd.geo%2Bjson",
      { headers: { "User-Agent": "mapa-modulo/1.0" } },
      (res) => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
        res.on("error", reject);
      }
    ).on("error", reject);
  });
}

function normalize(s) {
  return (s || "").toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .trim();
}

async function main() {
  console.log("Buscando lista de distritos de SP...");
  const distritos = await getDistritos();
  console.log(`${distritos.length} distritos encontrados`);

  // Mapear código IBGE → nome do distrito
  const codeToNome = {};
  for (const d of distritos) {
    codeToNome[String(d.id)] = d.nome;
  }

  console.log("\nBuscando malha GeoJSON do estado SP (pode demorar ~10s)...");
  const malha = await getMalha();
  console.log(`Features na malha: ${malha.features.length}`);

  if (malha.features.length === 0) {
    console.log("ERRO: nenhuma feature na malha IBGE");
    process.exit(1);
  }

  // Inspecionar propriedades da primeira feature
  const primeiraFeat = malha.features[0];
  console.log("Propriedades da 1ª feature:", JSON.stringify(primeiraFeat.properties));
  console.log("Bbox aproximada:", JSON.stringify(primeiraFeat.geometry?.coordinates?.[0]?.[0]?.slice(0, 2)));

  // Descobrir como identificar os distritos de SP na malha
  // A malha IBGE retorna features sem nome - só com codarea ou similar
  // Vamos tentar identificar pelo bbox (SP city ≈ lat -23.35 a -24.01, lng -46.19 a -47.10)
  const SP_LAT = [-24.01, -23.35];
  const SP_LNG = [-47.10, -46.19];

  function inSP(coords) {
    // Verificar se o centróide do polígono está dentro de SP city bounds (aproximado)
    const lats = coords.flat(2).filter((_, i) => i % 2 === 1);
    const lngs = coords.flat(2).filter((_, i) => i % 2 === 0);
    const clat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const clng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    return clat >= SP_LAT[0] && clat <= SP_LAT[1] && clng >= SP_LNG[0] && clng <= SP_LNG[1];
  }

  const spFeats = malha.features.filter(f =>
    f.geometry && f.geometry.coordinates && inSP(f.geometry.coordinates)
  );
  console.log(`Features dentro de SP city: ${spFeats.length}`);
  if (spFeats.length > 0) {
    console.log("Props de uma feature SP:", JSON.stringify(spFeats[0].properties));
  }
}

main().catch(console.error);
