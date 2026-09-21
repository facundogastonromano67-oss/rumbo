import { useTabla } from "../../core/sincronizacion.js";
import { tareasStore, pendientesDeHoy } from "./datos.js";
import { hoyISO, fechaRelativa } from "../../core/fecha.js";
import { ir } from "../../app/rutas.js";

export function Resumen() {
  const { filas, actualizar } = useTabla(tareasStore);
  const hoy = hoyISO();
  const pendientes = pendientesDeHoy(filas, hoy)
    .sort((a, b) => (a.vence_el || "").localeCompare(b.vence_el || "") || b.prioridad - a.prioridad);

  return (
    <article className="tarjeta" style={{ "--acento": "#ffa63d" }}>
      <header className="tarjeta-cab">
        <h2>Tareas</h2>
        <button className="tarjeta-link" onClick={() => ir("tareas")}>Ver todas</button>
      </header>

      {pendientes.length === 0 ? (
        <p className="tarjeta-vacio">Nada vencido ni para hoy. Bien ahí.</p>
      ) : (
        <ul className="lista lista-compacta">
          {pendientes.slice(0, 5).map((t) => (
            <li key={t.id} className="item">
              <button className="tilde"
                onClick={() => actualizar(t.id, { hecha: true, hecha_el: new Date().toISOString() })}
                aria-label="Marcar como hecha" />
              <span className="item-titulo">{t.titulo}</span>
              <span className={"item-fecha" + (t.vence_el < hoy ? " item-fecha-vencida" : "")}>
                {fechaRelativa(t.vence_el, hoy)}
              </span>
            </li>
          ))}
          {pendientes.length > 5 && (
            <li className="lista-nota">y {pendientes.length - 5} más</li>
          )}
        </ul>
      )}
    </article>
  );
}
