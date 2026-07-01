"use client";

import { useEffect, useRef } from "react";
import { bairros } from "@/data/bairros";

const ALUNOS: Record<string, number> = Object.fromEntries(
  bairros.map((b) => [b.nome, b.alunos])
);

const MAX = Math.max(...bairros.map((b) => b.alunos));

function getColor(alunos: number): string {
  if (!alunos) return "#F3F4F6";
  const r = alunos / MAX;
  if (r >= 0.6) return "#ED145B";
  if (r >= 0.35) return "#C4104A";
  if (r >= 0.2) return "#0099AA";
  if (r >= 0.1) return "#00C4B4";
  if (r >= 0.05) return "#915EF9";
  return "#5A008C";
}

export default function MapaCalor() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    import("leaflet").then(async (L) => {
      await import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center: [-23.52, -46.70],
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

      // Tooltip flutuante
      const tooltip = L.tooltip({
        sticky: true,
        opacity: 1,
        className: "modulo-tooltip",
      });

      // Carregar GeoJSON
      const resp = await fetch("/sp-bairros.geojson");
      const geojson = await resp.json();

      L.geoJSON(geojson, {
        style: (feature) => {
          const nome = feature?.properties?.name ?? "";
          const alunos = ALUNOS[nome] ?? 0;
          const color = getColor(alunos);
          return {
            color: alunos ? color : "#D1D5DB",
            weight: alunos ? 1.5 : 0.8,
            fillColor: color,
            fillOpacity: alunos ? 0.55 : 0.15,
          };
        },
        onEachFeature: (feature, layer) => {
          const nome = feature.properties?.name ?? "";
          const alunos = ALUNOS[nome] ?? 0;
          const color = getColor(alunos);

          layer.on("mouseover", (e) => {
            (layer as L.Path).setStyle({
              weight: 2.5,
              fillOpacity: alunos ? 0.75 : 0.3,
            });

            tooltip
              .setContent(
                `<div class="tip-nome">${nome}</div>
                 <div class="tip-count" style="color:${color}">${alunos}</div>
                 <div class="tip-label">aluno${alunos !== 1 ? "s" : ""} matriculado${alunos !== 1 ? "s" : ""}</div>`
              )
              .setLatLng(e.latlng)
              .addTo(map);
          });

          layer.on("mousemove", (e) => {
            tooltip.setLatLng(e.latlng);
          });

          layer.on("mouseout", () => {
            (layer as L.Path).setStyle({
              weight: alunos ? 1.5 : 0.8,
              fillOpacity: alunos ? 0.55 : 0.15,
            });
            tooltip.remove();
          });
        },
      }).addTo(map);
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
