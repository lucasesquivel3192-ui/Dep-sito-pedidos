import { useState, useEffect, useCallback } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGX_dHsyTJwhUfDCx4qnytPgZsBZYwpGDMw2Z9ns94bBkQTGtYv-j-C_yyGH6tWF1gqQ/exec";

const SECTORES = [
  { id: "cocina", nombre: "Cocina", emoji: "🍳", color: "#E07A5F" },
  { id: "panaderia", nombre: "Panadería & Pastelería", emoji: "🥐", color: "#C4A882" },
  { id: "pescaderia", nombre: "Pescadería", emoji: "🐟", color: "#5B8DB8" },
  { id: "pastas", nombre: "Pastas", emoji: "🍝", color: "#D4A017" },
];

const formatHora = (ts) => new Date(Number(ts)).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const hoyStr = () => new Date().toLocaleDateString("es-AR");

const getSemanaKey = (fechaStr) => {
  const [d, m, y] = fechaStr.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diffToLunes = day === 0 ? -6 : 1 - day;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diffToLunes);
  const dom = new Date(lunes);
  dom.setDate(lunes.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  return `${fmt(lunes)} — ${fmt(dom)}`;
};

const normalizarArticulo = (nombre) => nombre.toLowerCase().trim().replace(/\s+/g, " ");

async function apiFetch(data) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiGet() {
  const res = await fetch(SCRIPT_URL);
  return res.json();
}

function SemannaCard({ semana, semDatos, idx, getTopArticulos, getResumenSectores }) {
  const [filtro, setFiltro] = useState("todos");
  const [subVista, setSubVista] = useState("articulos");
  const topArts = getTopArticulos(semDatos, filtro);
  const resumenSectores = getResumenSectores(semDatos);
  const totalSemana = resumenSectores.reduce((a, s) => a + s.totalItems, 0);
  const maxCount = topArts[0]?.[1] || 1;

  return (
    <div style={{ background: "#222", borderRadius: 16, marginBottom: 20, overflow: "hidden", border: idx === 0 ? "1px solid #3A3A3A" : "1px solid #2A2A2A" }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #2A2A2A", background: idx === 0 ? "#282828" : "#222" }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{idx === 0 ? "🔴 Semana actual" : `Semana ${idx + 1}`}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{semana}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#E07A5F" }}>{totalSemana}</div>
          <div style={{ fontSize: 10, color: "#666" }}>artículos pedidos</div>
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #2A2A2A" }}>
        {[{ id: "articulos", label: "Top Artículos" }, { id: "sectores", label: "Por Sector" }].map(t => (
          <button key={t.id} onClick={() => setSubVista(t.id)} style={{ flex: 1, padding: "10px", background: "none", border: "none", cursor: "pointer", color: subVista === t.id ? "#E07A5F" : "#666", fontWeight: subVista === t.id ? 700 : 400, fontSize: 13, borderBottom: subVista === t.id ? "2px solid #E07A5F" : "2px solid transparent", fontFamily: "'DM Sans'" }}>{t.label}</button>
        ))}
      </div>
      {subVista === "articulos" && (
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
            {[{ id: "todos", nombre: "Todos", emoji: "📋" }, ...SECTORES.map(s => ({ id: s.id, nombre: s.nombre.split(" ")[0], emoji: s.emoji }))].map(s => (
              <button key={s.id} onClick={() => setFiltro(s.id)} style={{ background: filtro === s.id ? "#E07A5F" : "#2A2A2A", border: "none", borderRadius: 16, padding: "5px 10px", color: "#F0EDE8", fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'DM Sans'" }}>{s.emoji} {s.nombre}</button>
            ))}
          </div>
          {topArts.length === 0 && <div style={{ textAlign: "center", color: "#555", padding: "16px 0", fontSize: 13 }}>Sin datos para este sector</div>}
          {topArts.map(([art, count], i) => (
            <div key={art} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "#D0CDC8", textTransform: "capitalize", flex: 1, marginRight: 8 }}><span style={{ color: "#E07A5F", fontWeight: 700, marginRight: 6 }}>#{i + 1}</span>{art}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F0EDE8", flexShrink: 0 }}>{count}x</span>
              </div>
              <div style={{ height: 5, background: "#333", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / maxCount) * 100}%`, background: i === 0 ? "#E07A5F" : i === 1 ? "#C4A882" : "#5B8DB8", borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {subVista === "sectores" && (
        <div style={{ padding: "14px 16px" }}>
          {resumenSectores.map(s => {
            const pct = totalSemana > 0 ? Math.round((s.totalItems / totalSemana) * 100) : 0;
            const topArtsLocal = getTopArticulos(semDatos, s.id).slice(0, 3);
            return (
              <div key={s.id} style={{ marginBottom: 14, padding: "12px 14px", background: "#1A1A1A", borderRadius: 12, borderLeft: `3px solid ${s.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nombre}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{s.artUnicos} artículos distintos</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: s.color }}>{s.totalItems}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{pct}% del total</div>
                  </div>
                </div>
                <div style={{ height: 4, background: "#333", borderRadius: 2, marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 2 }} />
                </div>
                {topArtsLocal.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {topArtsLocal.map(([art, cnt]) => (
                      <span key={art} style={{ background: "#2A2A2A", borderRadius: 10, padding: "3px 8px", fontSize: 11, color: "#AAA" }}>{art} <span style={{ color: s.color, fontWeight: 700 }}>×{cnt}</span></span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [vista, setVista] = useState("inicio");
  const [sectorSeleccionado, setSectorSeleccionado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
< truncated lines 130-356 >
      {vista === "pedidos" && (
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: "'DM Serif Display'", fontSize: 22, marginBottom: 4 }}>Pedidos de Hoy</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 18 }}>{hoyStr()}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {[{ id: "todos", nombre: "Todos", emoji: "📋" }, ...SECTORES].map(s => (
              <button key={s.id} onClick={() => setFiltroSector(s.id)} style={{ background: filtroSector === s.id ? "#E07A5F" : "#222", border: "none", borderRadius: 20, padding: "7px 14px", color: "#F0EDE8", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{s.emoji} {s.nombre}</button>
            ))}
          </div>
          {pedidosFiltrados.length === 0 && (
            <div style={{ textAlign: "center", color: "#555", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div>No hay pedidos para este sector hoy</div>
            </div>
          )}
          {pedidosFiltrados.map(pedido => {
            const s = sectorInfo(pedido.sector);
            const total = pedido.articulos.length;
            const entregados = pedido.articulos.filter(a => a.entregado).length;
            const completo = pedido.estado === "completo";
            return (
              <div key={pedido.id} style={{ background: "#222", borderRadius: 16, marginBottom: 16, borderLeft: `4px solid ${completo ? "#27AE60" : s.color}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.nombre}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{formatHora(pedido.hora)} · {entregados}/{total} artículos</div>
                    {pedido.nota && <div style={{ fontSize: 12, color: "#C4A882", marginTop: 2 }}>⚠️ {pedido.nota}</div>}
                  </div>
                  <div style={{ background: completo ? "#27AE60" : "#333", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: completo ? "#fff" : "#888" }}>{completo ? "Completo" : "Pendiente"}</div>
                </div>
                <div style={{ borderTop: "1px solid #2A2A2A" }}>
                  {pedido.articulos.map((art, i) => (
                    <div key={i} onClick={() => toggleArticulo(pedido, i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < pedido.articulos.length - 1 ? "1px solid #2A2A2A" : "none", cursor: "pointer", background: art.entregado ? "#1E2A1E" : "transparent" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${art.entregado ? "#27AE60" : "#444"}`, background: art.entregado ? "#27AE60" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {art.entregado && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, flex: 1, textDecoration: art.entregado ? "line-through" : "none", color: art.entregado ? "#555" : "#F0EDE8" }}>{art.nombre}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid #2A2A2A" }}>
                  <button onClick={() => eliminarPedido(pedido.id)} style={{ background: "none", border: "1px solid #333", borderRadius: 8, padding: "6px 14px", color: "#888", fontSize: 12, cursor: "pointer" }}>Eliminar pedido</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CONSUMO SEMANAL ── */}
      {vista === "stats" && (
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: "'DM Serif Display'", fontSize: 22, marginBottom: 4 }}>Consumo Semanal</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Artículos más pedidos por semana</div>
          {semanasOrdenadas.length === 0 && (
            <div style={{ textAlign: "center", color: "#555", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div>Aún no hay datos suficientes</div>
            </div>
          )}
          {semanasOrdenadas.map((semana, idx) => (
            <SemannaCard key={semana} semana={semana} semDatos={estadisticas[semana]} idx={idx} getTopArticulos={getTopArticulos} getResumenSectores={getResumenSectores} />
          ))}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {vista === "historial" && (
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: "'DM Serif Display'", fontSize: 22, marginBottom: 6 }}>Historial</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Pedidos de días anteriores</div>
          {pedidosHistorial.length === 0 && (
            <div style={{ textAlign: "center", color: "#555", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div>No hay historial todavía</div>
            </div>
          )}
          {Object.entries(pedidosHistorial.reduce((acc, p) => { acc[p.fecha] = acc[p.fecha] || []; acc[p.fecha].push(p); return acc; }, {})).map(([fecha, ps]) => (
            <div key={fecha} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>{fecha}</div>
              {ps.map(p => {
                const s = sectorInfo(p.sector);
                const entregados = p.articulos.filter(a => a.entregado).length;
                return (
                  <div key={p.id} style={{ background: "#222", borderRadius: 14, padding: "13px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${s.color}` }}>
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nombre}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{entregados}/{p.articulos.length} artículos · {formatHora(p.hora)}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.estado === "completo" ? "#27AE60" : "#E07A5F" }}>{p.estado === "completo" ? "Completo" : "Incompleto"}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", borderTop: "1px solid #2A2A2A", display: "flex", zIndex: 10 }}>
        {[
          { id: "inicio", emoji: "🏠", label: "Inicio" },
          { id: "nuevo", emoji: "➕", label: "Nuevo" },
          { id: "pedidos", emoji: "📋", label: "Pedidos" },
          { id: "stats", emoji: "📊", label: "Consumo" },
          { id: "historial", emoji: "📂", label: "Historial" },
        ].map(nav => (
          <button key={nav.id} onClick={() => setVista(nav.id)} style={{ flex: 1, padding: "12px 2px 10px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: vista === nav.id ? "#E07A5F" : "#555" }}>
            <span style={{ fontSize: 18 }}>{nav.emoji}</span>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{nav.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes loading { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        * { -webkit-tap-highlight-color: transparent; }
        textarea:focus, input:focus { border-color: #E07A5F !important; }
      `}</style>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 };
const btnCard = (bg) => ({ background: bg, border: "none", borderRadius: 14, padding: "20px 14px", color: "#F0EDE8", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" });
