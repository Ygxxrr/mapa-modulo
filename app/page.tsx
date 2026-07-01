import { bairros, totalAlunos, COLEGIO } from "@/data/bairros";
import MapaWrapper from "@/components/MapaWrapper";

const top5 = [...bairros].sort((a, b) => b.alunos - a.alunos).slice(0, 5);

const legenda = [
  { label: "1–3 alunos",   color: "#D1C4E9" },
  { label: "4–8 alunos",   color: "#B39DDB" },
  { label: "9–14 alunos",  color: "#915EF9" },
  { label: "15–19 alunos", color: "#7B1FA2" },
  { label: "20+ alunos",   color: "#5A008C" },
];

export default function Home() {
  return (
    <div className="flex flex-col h-screen text-gray-800" style={{ background: "#F4F5F7" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ background: "#ED145B" }} />
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900">
              Colégio Módulo
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Matrículas por bairro · São Paulo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: "#ED145B" }}>
              {totalAlunos}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              alunos mapeados
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-800">{bairros.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">bairros</p>
          </div>
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
          style={{ background: "#FFFFFF", borderLeft: "1px solid #E5E7EB" }}
        >
          {/* Colégio */}
          <div className="p-4" style={{ borderBottom: "1px solid #F3F4F6", background: "#FFF5F8" }}>
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">🎓</span>
              <div>
                <p className="text-xs font-bold text-gray-800">{COLEGIO.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {COLEGIO.endereco}
                </p>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="p-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Legenda
            </h2>
            <ul className="space-y-2">
              {legenda.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/30"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Top 5 */}
          <div className="p-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Top 5 bairros
            </h2>
            <ol className="space-y-3">
              {top5.map((b, i) => (
                <li key={b.nome} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-300 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.nome}</p>
                    <div className="mt-1 h-1 rounded-full bg-gray-100">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${(b.alunos / top5[0].alunos) * 100}%`,
                          background: "#915EF9",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-black shrink-0" style={{ color: "#915EF9" }}>
                    {b.alunos}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Lista completa com distância */}
          <div className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Todos os bairros
            </h2>
            {/* Cabeçalho */}
            <div
              className="flex justify-between text-xs font-semibold mb-2 pb-2"
              style={{ color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
            >
              <span>Bairro</span>
              <div className="flex gap-3 shrink-0">
                <span className="w-8 text-right">Alunos</span>
                <span className="w-10 text-right">Dist.</span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {[...bairros]
                .sort((a, b) => b.alunos - a.alunos)
                .map((b) => (
                  <li
                    key={b.nome}
                    className="flex justify-between items-center text-xs text-gray-500"
                  >
                    <span className="truncate mr-2">{b.nome}</span>
                    <div className="flex gap-3 shrink-0">
                      <span className="w-8 text-right font-bold text-gray-800">{b.alunos}</span>
                      <span className="w-10 text-right text-gray-400">
                        {b.distKm} km
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
