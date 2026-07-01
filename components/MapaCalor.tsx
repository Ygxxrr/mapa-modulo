"use client";

import { useEffect, useRef } from "react";
import { bairros, COLEGIO } from "@/data/bairros";

const ALUNOS: Record<string, number> = Object.fromEntries(
  bairros.map((b) => [b.nome, b.alunos])
);
const MAX = Math.max(...bairros.map((b) => b.alunos));

function getFillColor(alunos: number): string {
  if (!alunos) return "#E5E7EB";
  const r = alunos / MAX;
  if (r >= 0.7)  return "#5A008C";
  if (r >= 0.45) return "#7B1FA2";
  if (r >= 0.25) return "#915EF9";
  if (r >= 0.12) return "#B39DDB";
  return "#D1C4E9";
}

function getRestOpacity(alunos: number): number {
  if (!alunos) return 0;
  const r = alunos / MAX;
  if (r >= 0.7)  return 0.22;
  if (r >= 0.45) return 0.18;
  if (r >= 0.25) return 0.14;
  return 0.10;
}

const SCHOOL_ICON_HTML = `
  <div style="
    width:36px;height:36px;
    background:#ED145B;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(0,0,0,0.25);
    display:flex;align-items:center;justify-content:center;
  ">
    <span style="transform:rotate(45deg);font-size:16px;line-height:1;">🎓</span>
  </div>`;

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

      // Marcador do Colégio Módulo
      const schoolIcon = L.divIcon({
        html: SCHOOL_ICON_HTML,
        iconSize: [36, 36],
        iconAnchor: [0, 36],
        popupAnchor: [18, -36],
        className: "",
      });

      L.marker([COLEGIO.lat, COLEGIO.lng], { icon: schoolIcon })
        .addTo(map)
        .bindPopup(
          `<div class="school-popup">
            <div class="sp-label">📍 Colégio Módulo</div>
            <div class="sp-addr">${COLEGIO.endereco}</div>
          </div>`,
          { className: "modulo-popup", maxWidth: 240 }
        );

      // Detecta se é touch (celular/tablet)
      const isTouch = window.matchMedia("(pointer: coarse)").matches;

      // Tooltip para desktop (hover)
      const tooltip = L.tooltip({
        sticky: true,
        opacity: 1,
        className: "modulo-tooltip",
        offset: [14, 0],
      });

      const resp = await fetch("/sp-bairros.geojson");
      const geojson = await resp.json();

      const filtered = {
        ...geojson,
        features: geojson.features.filter(
          (f: { properties?: { aprox?: boolean } }) => !f.properties?.aprox
        ),
      };

      L.geoJSON(filtered, {
        style: (feature) => {
          const nome = feature?.properties?.name ?? "";
          const alunos = ALUNOS[nome] ?? 0;
          const color = getFillColor(alunos);
          return {
            color: alunos ? color : "#D1D5DB",
            weight: alunos ? 2 : 1,
            fillColor: color,
            fillOpacity: getRestOpacity(alunos),
            opacity: alunos ? 0.85 : 0.35,
          };
        },
        onEachFeature: (feature, layer) => {
          const nome = feature.properties?.name ?? "";
          const alunos = ALUNOS[nome] ?? 0;
          const color = getFillColor(alunos);
          const restOpacity = getRestOpacity(alunos);

          const popupContent = `
            <div class="tip-nome">${nome}</div>
            <div class="tip-count" style="color:${alunos ? color : "#9CA3AF"}">${alunos || "–"}</div>
            <div class="tip-label">${
              alunos
                ? `aluno${alunos !== 1 ? "s" : ""} matriculado${alunos !== 1 ? "s" : ""}`
                : "sem dados"
            }</div>`;

          if (isTouch) {
            // Mobile: toque abre popup fixo com as informações
            layer.on("click", (e) => {
              if (alunos) {
                (layer as L.Path).setStyle({ fillOpacity: 0.55, weight: 2.5 });
              }
              L.popup({ className: "modulo-tooltip modulo-popup-touch", maxWidth: 180, autoPan: true })
                .setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(map);
            });

            // Volta ao estilo original quando o popup fecha
            map.on("popupclose", () => {
              (layer as L.Path).setStyle({
                fillOpacity: restOpacity,
                weight: alunos ? 2 : 1,
              });
            });
          } else {
            // Desktop: hover com tooltip seguindo o mouse
            layer.on("mouseover", (e) => {
              if (alunos) {
                (layer as L.Path).setStyle({ fillOpacity: 0.52, weight: 2.5, opacity: 1 });
              }
              tooltip
                .setContent(popupContent)
                .setLatLng(e.latlng)
                .addTo(map);
            });

            layer.on("mousemove", (e) => tooltip.setLatLng(e.latlng));

            layer.on("mouseout", () => {
              (layer as L.Path).setStyle({
                fillOpacity: restOpacity,
                weight: alunos ? 2 : 1,
                opacity: alunos ? 0.85 : 0.35,
              });
              tooltip.remove();
            });
          }
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
