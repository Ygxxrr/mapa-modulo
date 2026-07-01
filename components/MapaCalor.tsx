"use client";

import { useEffect, useRef } from "react";
import { bairros } from "@/data/bairros";

const ALUNOS: Record<string, number> = Object.fromEntries(
  bairros.map((b) => [b.nome, b.alunos])
);
const MAX = Math.max(...bairros.map((b) => b.alunos));

// Escala de magenta (cor da marca) com intensidade crescente
function getFillColor(alunos: number): string {
  if (!alunos) return "#D1D5DB";
  const r = alunos / MAX;
  if (r >= 0.7) return "#ED145B"; // magenta pleno
  if (r >= 0.45) return "#F24E83"; // magenta médio
  if (r >= 0.25) return "#F77EAA"; // rosa médio
  if (r >= 0.12) return "#FAA8C5"; // rosa claro
  return "#FDD6E5";                 // rosa muito claro
}

// Opacidade de preenchimento: muito baixa no repouso para não tampar o mapa
function getRestOpacity(alunos: number): number {
  if (!alunos) return 0;
  const r = alunos / MAX;
  if (r >= 0.7) return 0.18;
  if (r >= 0.45) return 0.14;
  if (r >= 0.25) return 0.11;
  return 0.08;
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

      const tooltip = L.tooltip({
        sticky: true,
        opacity: 1,
        className: "modulo-tooltip",
        offset: [14, 0],
      });

      const resp = await fetch("/sp-bairros.geojson");
      const geojson = await resp.json();

      // Filtrar apenas polígonos reais do OSM (sem os retângulos aproximados)
      const geojsonFiltrado = {
        ...geojson,
        features: geojson.features.filter(
          (f: { properties?: { aprox?: boolean } }) => !f.properties?.aprox
        ),
      };

      L.geoJSON(geojsonFiltrado, {
        style: (feature) => {
          const nome = feature?.properties?.name ?? "";
          const alunos = ALUNOS[nome] ?? 0;
          const color = getFillColor(alunos);
          return {
            color: alunos ? color : "#D1D5DB",
            weight: alunos ? 2 : 1,
            fillColor: color,
            fillOpacity: getRestOpacity(alunos),
            opacity: alunos ? 0.8 : 0.4,
          };
        },
        onEachFeature: (feature, layer) => {
          const nome = feature.properties?.name ?? "";
          const alunos = ALUNOS[nome] ?? 0;
          const color = getFillColor(alunos);
          const restOpacity = getRestOpacity(alunos);

          layer.on("mouseover", (e) => {
            if (alunos) {
              (layer as L.Path).setStyle({
                fillOpacity: 0.55,
                weight: 2.5,
                opacity: 1,
              });
            }
            tooltip
              .setContent(
                `<div class="tip-nome">${nome}</div>
                 <div class="tip-count" style="color:${alunos ? color : "#9CA3AF"}">${alunos || "–"}</div>
                 <div class="tip-label">${alunos ? `aluno${alunos !== 1 ? "s" : ""} matriculado${alunos !== 1 ? "s" : ""}` : "sem dados"}</div>`
              )
              .setLatLng(e.latlng)
              .addTo(map);
          });

          layer.on("mousemove", (e) => tooltip.setLatLng(e.latlng));

          layer.on("mouseout", () => {
            (layer as L.Path).setStyle({
              fillOpacity: restOpacity,
              weight: alunos ? 2 : 1,
              opacity: alunos ? 0.8 : 0.4,
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
