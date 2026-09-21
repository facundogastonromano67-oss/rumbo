import { useEffect, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import { bloquesStore, ahoraYDespues } from "./datos.js";
import { ir } from "../../app/rutas.js";

export function Resumen() {
  const { filas } = useTabla(bloquesStore);
  const [reloj, setReloj] = useState(() => new Date());

  // El bloque "ahora" cambia solo con el paso del tiempo: se revisa cada minuto.
  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { ahora, despues, hoy } = ahoraYDespues(filas, reloj);

  return (
    <article className="tarjeta" style={{ "--acento": "#a882e8" }}>
      <header className="tarjeta-cab">
        <h2>Rutina</h2>
        <button className="tarjeta-link" onClick={() => ir("rutina")}>Ver semana</button>
      </header>

      {hoy.length === 0 ? (
        <p className="tarjeta-vacio">Hoy no tenés bloques cargados.</p>
      ) : (
        <>
          {ahora ? (
            <div className="ahora" style={{ borderColor: ahora.color }}>
              <small>Ahora</small>
              <strong>{ahora.nombre}</strong>
              <span>hasta las {ahora.hora_fin.slice(0, 5)}</span>
            </div>
          ) : (
            <p className="tarjeta-vacio">Sin bloque en curso.</p>
          )}

          {despues.length > 0 && (
            <ul className="lista lista-compacta">
              {despues.slice(0, 3).map((b) => (
                <li key={b.id} className="item">
                  <span className="punto" style={{ background: b.color }} />
                  <span className="item-titulo">{b.nombre}</span>
                  <span className="item-fecha">{b.hora_inicio.slice(0, 5)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  );
}
