import { useMemo } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import { movimientosStore, vencimientosStore, primerDiaDe, totales, porVencer } from "./datos.js";
import { hoyISO, mesDe } from "../../core/fecha.js";
import { plata } from "../../core/formato.js";
import { ir } from "../../app/rutas.js";

export function Resumen() {
  const hoy = hoyISO();
  const mes = mesDe(hoy);
  const movimientos = useTabla(movimientosStore, {
    filtros: { fecha: { op: "gte", valor: primerDiaDe(mes) } },
  });
  const vencimientos = useTabla(vencimientosStore);

  const t = useMemo(() => totales(movimientos.filas), [movimientos.filas]);
  const pendientes = useMemo(() => porVencer(vencimientos.filas, mes, hoy), [vencimientos.filas, mes, hoy]);
  const proximos = pendientes.filter((v) => v.dias !== null && v.dias <= 7);

  return (
    <article className="tarjeta" style={{ "--acento": "#3fa9c9" }}>
      <header className="tarjeta-cab">
        <h2>Finanzas</h2>
        <button className="tarjeta-link" onClick={() => ir("finanzas")}>Ver mes</button>
      </header>

      <p className={"tarjeta-dato" + (t.balance < 0 ? " tarjeta-dato-mal" : "")}>
        {plata(t.balance)}
      </p>
      <p className="tarjeta-sub">
        Entró {plata(t.ingresos)} · Salió {plata(t.egresos)}
      </p>

      {proximos.length > 0 && (
        <ul className="lista lista-compacta">
          {proximos.slice(0, 3).map((v) => (
            <li key={v.id} className={"item" + (v.dias < 0 ? " item-alerta" : "")}>
              <span className="item-titulo">{v.nombre}</span>
              <span className="item-fecha">
                {v.dias < 0 ? `venció hace ${-v.dias} d` : v.dias === 0 ? "vence hoy" : `en ${v.dias} d`}
              </span>
              <span className="item-monto">{plata(v.monto)}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
