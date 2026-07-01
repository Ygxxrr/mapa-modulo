import { bairros, totalAlunos } from "@/data/bairros";
import MapaWrapper from "@/components/MapaWrapper";

const top5 = [...bairros].sort((a, b) => b.alunos - a.alunos).slice(0, 5);

const legenda = [
  { label: "1 aluno",       color: "#5A008C" },
  { label: "2–3 alunos",    color: "#915EF9" },
  { label: "4–6 alunos",    color: "#00FFD9" },
  { label: "7–12 alunos",   color: "#25DBEF" },
  { label: "13–19 alunos",  color: "#C4104A" },
  { label: "20+ alunos",    color: "#ED145B" },
];

export default function Home() {
  return (
    <div className="flex flex-col h-screen text-white" style={{ background: "#1A1D20" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ background: "#111315", borderBottom: "1px solid #ED145B33" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-1 h-10 rounded-full"
            style={{ background: "#ED145B" }}
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Colégio Módulo
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#AAAAAA" }}>
              Mapa de matrículas por bairro · São Paulo
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black" style={{ color: "#25DBEF" }}>
            {totalAlunos}
          </p>
          <p className="text-xs uppercase tracking-wider" style={{ color: "#AAAAAA" }}>
            alunos mapeados
          </p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mapa */}
        <main className="flex-1 relative">
          <MapaWrapper />
        </main>

        {/* Sidebar */}
        <aside
          className="w-64 flex flex-col overflow-y-auto shrink-0"
          style={{ background: "#111315", borderLeft: "1px solid #ED145B33" }}
        >
          {/* Legenda */}
          <div className="p-4" style={{ borderBottom: "1px solid #1A1D20" }}>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#ED145B" }}
            >
              Legenda
            </h2>
            <ul className="space-y-2">
              {legenda.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5 text-sm text-white">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}88` }}
                  />
                  {l.label}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-3" style={{ color: "#616D72" }}>
              Tamanho proporcional ao número de alunos.
            </p>
          </div>

          {/* Top 5 */}
          <div className="p-4" style={{ borderBottom: "1px solid #1A1D20" }}>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#ED145B" }}
            >
              Top 5 bairros
            </h2>
            <ol className="space-y-3">
              {top5.map((b, i) => (
                <li key={b.nome} className="flex items-center gap-3">
                  <span
                    className="text-xs font-black w-4 shrink-0"
                    style={{ color: "#616D72" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">
                      {b.nome}
                    </p>
                    <div
                      className="mt-1 h-1 rounded-full"
                      style={{ background: "#1A1D20" }}
                    >
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${(b.alunos / top5[0].alunos) * 100}%`,
                          background: "#ED145B",
                          boxShadow: "0 0 6px #ED145B88",
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-sm font-black shrink-0"
                    style={{ color: "#ED145B" }}
                  >
                    {b.alunos}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Lista completa */}
          <div className="p-4">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#ED145B" }}
            >
              Todos os bairros ({bairros.length})
            </h2>
            <ul className="space-y-1.5">
              {[...bairros]
                .sort((a, b) => b.alunos - a.alunos)
                .map((b) => (
                  <li
                    key={b.nome}
                    className="flex justify-between items-center text-xs"
                    style={{ color: "#AAAAAA" }}
                  >
                    <span className="truncate mr-2">{b.nome}</span>
                    <span className="font-bold text-white shrink-0">
                      {b.alunos}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
