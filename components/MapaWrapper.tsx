"use client";

import dynamic from "next/dynamic";

const MapaCalor = dynamic(() => import("@/components/MapaCalor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">
      Carregando mapa…
    </div>
  ),
});

export default function MapaWrapper() {
  return <MapaCalor />;
}
