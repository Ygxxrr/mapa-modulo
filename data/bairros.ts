export interface Bairro {
  nome: string;
  lat: number;
  lng: number;
  alunos: number;
  distKm: number;
}

export const COLEGIO = {
  nome: "Colégio Módulo",
  endereco: "Rua Tito, 1175 — Lapa, São Paulo",
  lat: -23.5285023,
  lng: -46.7031357,
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function b(nome: string, lat: number, lng: number, alunos: number): Bairro {
  return { nome, lat, lng, alunos, distKm: haversine(COLEGIO.lat, COLEGIO.lng, lat, lng) };
}

export const bairros: Bairro[] = [
  b("Vila Leopoldina",               -23.5218, -46.7378, 32),
  b("Vila Romana",                   -23.5252, -46.6960, 28),
  b("Vila Ipojuca",                  -23.5278, -46.7100, 26),
  b("Lapa",                          -23.5251, -46.7047, 24),
  b("Água Branca",                   -23.5155, -46.6790, 21),
  b("Vila Anastácio",               -23.5190, -46.7210, 15),
  b("Perdizes",                      -23.5370, -46.6698, 14),
  b("Vila Pompéia",                 -23.5408, -46.6806, 12),
  b("Lapa de Baixo",                -23.5120, -46.6980,  7),
  b("Alto da Lapa",                  -23.5280, -46.7337,  6),
  b("Jardim Íris",                  -23.5360, -46.7680,  5),
  b("Parque São Domingos",          -23.5050, -46.7530,  4),
  b("Barra Funda",                   -23.5255, -46.6614,  3),
  b("Jaguaré",                      -23.5435, -46.7453,  3),
  b("City América",                 -23.5190, -46.7080,  3),
  b("Parque Residencial da Lapa",   -23.5080, -46.7219,  3),
  b("Siciliano",                     -23.5298, -46.6847,  3),
  b("Jardim Felicidade (Zona Oeste)",-23.4803, -46.7664,  2),
  b("Pinheiros",                     -23.5629, -46.6812,  2),
  b("Vila Madalena",                -23.5553, -46.6891,  2),
  b("Vila Progredior",              -23.5374, -46.7228,  2),
  b("Parque dos Lima",              -23.5076, -46.7597,  2),
  b("Sumaré",                       -23.5440, -46.6697,  2),
  b("Piqueri",                       -23.5068, -46.7116,  2),
  b("Vila Albertina",               -23.3851, -46.6488,  2),
  b("Bela Aliança",                 -23.5204, -46.7142,  2),
  b("Jardim Britânia",             -23.5703, -46.7270,  2),
  b("Sumarezinho",                  -23.5458, -46.6784,  2),
  b("Vila Anglo Brasileira",         -23.5441, -46.6879,  2),
  b("Jardim Marilu",                -23.5068, -46.7392,  2),
  b("Jardim São João (Jaraguá)",    -23.4792, -46.7932,  2),
  b("Vila Mirante",                 -23.5188, -46.7403,  1),
  b("Itaberaba",                     -23.4630, -46.7400,  1),
  b("Vila São Vicente",             -23.5370, -46.6927,  1),
  b("Várzea da Barra Funda",       -23.5270, -46.6590,  1),
  b("Jardim Mangalot",              -23.4800, -46.7540,  1),
  b("Jardim do Lago",              -23.4900, -46.7620,  1),
  b("Parque da Lapa",              -23.5150, -46.7300,  1),
  b("Bom Retiro",                   -23.5240, -46.6380,  1),
  b("Jaraguá",                      -23.4710, -46.7720,  1),
  b("Parque Maria Domitila",        -23.4750, -46.7540,  1),
  b("Boaçava",                      -23.5340, -46.7360,  1),
  b("Alto de Pinheiros",            -23.5450, -46.7200,  1),
  b("Jardim Cidade Pirituba",       -23.4680, -46.7450,  1),
  b("Jardim Luíza (Fazendinha)",   -23.4900, -46.7800,  1),
  b("Vila Mangalot",               -23.4850, -46.7570,  1),
  b("Vila Primavera",              -23.5320, -46.7050,  1),
  b("Aclimação",                   -23.5680, -46.6340,  1),
  b("Imirim",                       -23.4340, -46.6700,  1),
  b("Vila Marina",                 -23.5450, -46.7100,  1),
  b("Vila Olímpia",               -23.5988, -46.6850,  1),
  b("Vila Carmosina",              -23.5490, -46.5530,  1),
  b("Jardim Paulistano (Zona Norte)", -23.4200, -46.6380, 1),
  b("Vila Amélia",                 -23.4590, -46.6350,  1),
  b("Jardim Santa Mônica",        -23.5000, -46.7650,  1),
  b("Jardim São José (Zona Norte)", -23.4700, -46.6550,  1),
  b("Vila Bonilha",               -23.5100, -46.7480,  1),
];

export const totalAlunos = bairros.reduce((sum, b) => sum + b.alunos, 0);
export const maxAlunos = Math.max(...bairros.map((b) => b.alunos));
