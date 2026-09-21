import { useTabla } from "../../core/sincronizacion.js";
import { sesionesStore } from "./datos.js";
import { hoyISO, fechaRelativa, diasEntre, inicioSemana } from "../../core/fecha.js";
import { ir } from "../../app/rutas.js";

export function Resumen() {
  const { filas } = useTabla(sesionesStore, { limite: 12 });
  const hoy = hoyISO();
  const ultima = filas[0] || null;
  const estaSemana = filas.filter((s) => s.fecha >= inicioSemana(hoy)).length;

  return (
    <article className="tarjeta" style={{ "--acento": "#ff7a30" }}>
      <header className="tarjeta-cab">
        <h2>Entrenamiento</h2>
        <button className="tarjeta-link" onClick={() => ir("entrenamiento")}>Ver</button>
      </header>

      {!ultima ? (
        <p className="tarjeta-vacio">Todavía no registraste sesiones.</p>
      ) : (
        <>
          <p className="tarjeta-dato">
            {estaSemana} {estaSemana === 1 ? "sesión" : "sesiones"} esta semana
          </p>
          <p className="tarjeta-sub">
            Última: {ultima.nombre}, {fechaRelativa(ultima.fecha, hoy)}
            {diasEntre(ultima.fecha, hoy) >= 4 && (
              <span className="aviso-suave"> · hace {diasEntre(ultima.fecha, hoy)} días</span>
            )}
          </p>
        </>
      )}
    </article>
  );
}
