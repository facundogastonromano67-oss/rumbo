import { useMemo } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import {
  habitosStore, registrosStore, indexar, cumplido, habitosDeHoy, racha, desdeCuando,
} from "./datos.js";
import { hoyISO } from "../../core/fecha.js";
import { ir } from "../../app/rutas.js";

export function Resumen() {
  const habitos = useTabla(habitosStore);
  const registros = useTabla(registrosStore, {
    filtros: { fecha: { op: "gte", valor: desdeCuando() } },
  });

  const hoy = hoyISO();
  const indice = useMemo(() => indexar(registros.filas), [registros.filas]);
  const deHoy = habitosDeHoy(habitos.filas, hoy);
  const hechos = deHoy.filter((h) => cumplido(h, indice.get(h.id + "|" + hoy))).length;

  async function marcar(h) {
    const reg = indice.get(h.id + "|" + hoy);
    const meta = Number(h.meta_diaria || 1);
    if (!reg) return registros.crear({ habito_id: h.id, fecha: hoy, valor: 1 });
    const nuevo = Number(reg.valor) + 1;
    if (nuevo > meta) return registros.borrar(reg.id);
    return registros.actualizar(reg.id, { valor: nuevo });
  }

  return (
    <article className="tarjeta" style={{ "--acento": "#3ea97f" }}>
      <header className="tarjeta-cab">
        <h2>Hábitos</h2>
        <button className="tarjeta-link" onClick={() => ir("habitos")}>Ver todos</button>
      </header>

      {deHoy.length === 0 ? (
        <p className="tarjeta-vacio">Hoy no toca ninguno.</p>
      ) : (
        <>
          <p className="tarjeta-dato">{hechos} de {deHoy.length} hechos</p>
          <ul className="lista lista-compacta">
            {deHoy.map((h) => {
              const reg = indice.get(h.id + "|" + hoy);
              const ok = cumplido(h, reg);
              const r = racha(h, indice, hoy);
              return (
                <li key={h.id} className={"item" + (ok ? " item-hecho" : "")}>
                  <button className={"tilde" + (ok ? " tilde-on" : "")}
                    style={ok ? { background: h.color, borderColor: h.color } : undefined}
                    onClick={() => marcar(h)} aria-label={h.nombre}>
                    {ok ? "✓" : ""}
                  </button>
                  <span className="item-titulo">{h.nombre}</span>
                  {h.meta_diaria > 1 && (
                    <span className="item-fecha">{Number(reg?.valor || 0)}/{h.meta_diaria}</span>
                  )}
                  {r > 0 && <span className="racha-chip">{r}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
