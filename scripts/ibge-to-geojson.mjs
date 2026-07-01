import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import shapefile from "shapefile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, "..", ".next", "cache", "ibge-tmp");
const OUT = path.join(__dirname, "..", "public", "sp-bairros.geojson");

// IBGE FTP: malha de distritos do estado de SP (2022)
const ZIP_URL = "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2022/UFs/SP/SP_Distritos_2022.zip";

// Código do município de São Paulo
const COD_SP = "3550308";

// Mapeamento nome OSM/planilha → nome oficial IBGE (para normalizar grafia)
const NOME_MAP = {
  "Água Branca":          "ÁGUA BRANCA",
  "Alto da Lapa":         "ALTO DA LAPA",
  "Alto de Pinheiros":    "ALTO DE PINHEIROS",
  "Aclimação":           "ACLIMAÇÃO",
  "Barra Funda":          "BARRA FUNDA",
  "Bom Retiro":           "BOM RETIRO",
  "Imirim":               "IMIRIM",
  "Itaberaba":            "ITABERABA",
  "Jaraguá":             "JARAGUÁ",
  "Jaguaré":             "JAGUARÉ",
  "Lapa":                 "LAPA",
  "Lapa de Baixo":        "LAPA DE BAIXO",
  "Parque São Domingos": "PARQUE SÃO DOMINGOS",
  "Perdizes":             "PERDIZES",
  "Pinheiros":            "PINHEIROS",
  "Piqueri":              "PIQUERI",
  "Sumaré":              "SUMARÉ",
  "Sumarezinho":          "SUMAREZINHO",
  "Vila Anglo Brasileira":"VILA ANGLO BRASILEIRA",
  "Vila Anastácio":      "VILA ANASTÁCIO",
  "Vila Leopoldina":      "VILA LEOPOLDINA",
  "Vila Madalena":        "VILA MADALENA",
  "Vila Olímpia":        "VILA OLÍMPIA",
  "Vila Pompéia":        "VILA POMPÉIA",
  "Vila Romana":          "VILA ROMANA",
  "Bela Vista":           "BELA VISTA",
  "Vila Ipojuca":         "VILA IPOJUCA",
  "Vila São Vicente":    "VILA SÃO VICENTE",
  "Boaçava":             "BOAÇAVA",
  "Siciliano":            "SICILIANO",
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "mapa-modulo/1.0" } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

async function main() {
  fs.mkdirSync(TMP, { recursive: true });
  const zipPath = path.join(TMP, "SP_Distritos_2022.zip");

  if (!fs.existsSync(zipPath)) {
    console.log("Baixando shapefile IBGE (~5MB)...");
    await download(ZIP_URL, zipPath);
    console.log("Download concluído.");
  } else {
    console.log("Zip já em cache.");
  }

  console.log("Extraindo...");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(TMP, true);

  const shpFile = fs.readdirSync(TMP).find((f) => f.endsWith(".shp"));
  if (!shpFile) throw new Error("Arquivo .shp não encontrado no zip");
  const shpPath = path.join(TMP, shpFile);
  const dbfPath = shpPath.replace(".shp", ".dbf");

  console.log(`Lendo shapefile: ${shpFile}`);
  const source = await shapefile.open(shpPath, dbfPath, { encoding: "utf-8" });

  // Normalizar: maiúsculo sem acento para match fuzzy
  const normalize = (s) =>
    (s || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();

  // Conjunto de nomes da planilha normalizados → nome original
  const planilhaNomes = new Map();
  for (const [orig, ibge] of Object.entries(NOME_MAP)) {
    planilhaNomes.set(normalize(ibge), orig);
  }

  const features = [];
  let total = 0;

  let result;
  while (!(result = await source.read()).done) {
    const feat = result.value;
    const props = feat.properties;
    // Filtrar apenas município de São Paulo
    const codMun = String(props.CD_MUN || props.CD_GEOCODM || props.CD_GEOD || props.geocodigo || "").substring(0, 7);
    if (codMun !== COD_SP) continue;
    total++;

    const nomeIBGE = props.NM_DIST || props.NM_DISTRIT || props.name || "";
    const nomeNorm = normalize(nomeIBGE);
    const nomePlanilha = planilhaNomes.get(nomeNorm);

    features.push({
      type: "Feature",
      geometry: feat.geometry,
      properties: {
        name: nomePlanilha || nomeIBGE,
        ibge_nome: nomeIBGE,
        cod: props.CD_GEOCODI || "",
        matched: !!nomePlanilha,
      },
    });
  }

  console.log(`Distritos de SP encontrados: ${total}`);
  console.log(`Features com match na planilha: ${features.filter(f => f.properties.matched).length}`);
  features.filter(f => f.properties.matched).forEach(f =>
    console.log(`  ✓ ${f.properties.ibge_nome} → ${f.properties.name}`)
  );

  const geojson = { type: "FeatureCollection", features };
  fs.writeFileSync(OUT, JSON.stringify(geojson), "utf8");
  console.log(`\nSalvo: ${features.length} distritos em ${OUT}`);
}

main().catch(console.error);
