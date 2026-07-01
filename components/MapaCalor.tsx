"use client";

import { useEffect, useRef } from "react";
import { bairros, maxAlunos } from "@/data/bairros";

function getColor(alunos: number): string {
  const ratio = alunos / maxAlunos;
  if (ratio >= 0.6) return "#ED145B";
  if (ratio >= 0.35) return "#C4104A";
  if (ratio >= 0.2) return "#0099AA";
  if (ratio >= 0.1) return "#00C4B4";
  if (ratio >= 0.05) return "#915EF9";
  return "#5A008C";
}

function getRadius(alunos: number): number {
  return 400 + (alunos / maxAlunos) * 2600;
}

export default function MapaCalor() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center: [-23.52, -46.71],
        zoom: 12,
        zoomControl: true,
      });

      mapInstance.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      bairros.forEach((b) => {
        const color = getColor(b.alunos);
        const circle = L.circle([b.lat, b.lng], {
          color: color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.35,
          radius: getRadius(b.alunos),
        }).addTo(map);

        circle.bindPopup(
          `<div style="font-family:sans-serif;min-width:160px">
            <div style="font-size:12px;font-weight:600;color:#6B7280;margin-bottom:4px">
              ${b.nome}
            </div>
            <div style="font-size:26px;font-weight:800;color:${color};line-height:1">
              ${b.alunos}
            </div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:2px">
              aluno${b.alunos !== 1 ? "s" : ""} matriculado${b.alunos !== 1 ? "s" : ""}
            </div>
          </div>`,
          { maxWidth: 200, className: "modulo-popup" }
        );
      });
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
