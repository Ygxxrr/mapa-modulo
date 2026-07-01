"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen text-gray-800" style={{ background: "#F4F5F7" }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", zIndex: 30, position: "relative" }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/logo-modulo.png"
            alt="Colégio Módulo"
            width={140}
            height={40}
            className="h-8 md:h-10 w-auto"
            priority
          />
          <p className="text-xs text-gray-400 hidden sm:block">
            Matrículas por bairro · São Paulo
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-6">

          {/* Mobile: exibe alunos + bairros compacto em linha */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="text-right">
              <p className="text-base font-black leading-none" style={{ color: "#ED145B" }}>
                {totalAlunos}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">alunos</p>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="text-right">
              <p className="text-base font-black leading-none text-gray-800">{bairros.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">bairros</p>
            </div>
          </div>

          {/* Desktop: blocos separados */}
          <div className="text-right hidden md:block">
            <p className="text-2xl font-black" style={{ color: "#ED145B" }}>{totalAlunos}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">alunos mapeados</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-2xl font-black text-gray-800">{bairros.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">bairros</p>
          </div>

          {/* Botão toggle sidebar — visível só no mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 active:bg-gray-50"
            aria-label="Abrir painel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Corpo ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mapa — sempre ocupa tudo */}
        <main className="flex-1 relative">
          <MapaWrapper />
        </main>

        {/* ── Overlay mobile (fecha ao clicar fora) ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 md:hidden"
            style={{ zIndex: 9998 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ──
            Mobile: gaveta fixa deslizante (translate-x)
            Desktop: coluna estática no flex-row */}
        <aside
          style={{
            zIndex: 9999,
            background: "#FFFFFF",
            borderLeft: "1px solid #E5E7EB",
            width: "17rem",
          }}
          className={[
            "fixed top-0 right-0 h-full",   // mobile: fixed sobre o mapa
            "md:static md:h-full",           // desktop: entra no flow flex
            "flex flex-col overflow-y-auto shrink-0",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "translate-x-full",
            "md:translate-x-0",
          ].join(" ")}
        >
          {/* Botão fechar — só no mobile */}
          <div
            className="flex items-center justify-between px-4 py-3 md:hidden shrink-0"
            style={{ borderBottom: "1px solid #F3F4F6" }}
          >
            <span className="text-sm font-semibold text-gray-800">Informações</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              aria-label="Fechar painel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Colégio */}
          <div className="p-4 shrink-0" style={{ borderBottom: "1px solid #F3F4F6", background: "#FFF5F8" }}>
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5 shrink-0">🎓</span>
              <div>
                <p className="text-xs font-bold text-gray-800">{COLEGIO.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {COLEGIO.endereco}
                </p>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="p-4 shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Legenda
            </h2>
            <ul className="space-y-2">
              {legenda.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Top 5 */}
          <div className="p-4 shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
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
                      <span className="w-10 text-right text-gray-400">{b.distKm} km</span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* ── FAB mobile: abre o sidebar ── */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ background: "#ED145B", zIndex: 35 }}
        aria-label="Ver informações"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </button>
    </div>
  );
}
