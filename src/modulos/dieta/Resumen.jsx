import { useMemo } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import { usePerfil } from "../../core/perfil.jsx";
import { comidasStore, itemsStore, MACROS, sumar } from "./datos.js";
import { hoyISO } from "../../core/fecha.js";
import { numero } from "../../core/formato.js";
import { Progreso } from "../../core/ui/index.jsx";
import { ir } from "../../app/rutas.js";

export function Resumen() {
  const fecha = hoyISO();
  const { perfil } = usePerfil();
  const comidas = useTabla(comidasStore, { filtros: { fecha } });
  const ids = useMemo(() => comidas.filas.map((c) => c.id), [comidas.filas]);
  const items = useTabla(itemsStore, { filtros: { comida_id: ids }, activo: ids.length > 0 });

  const total = useMemo(() => sumar(items.filas), [items.filas]);
  const objetivoKcal = Number(perfil?.kcal_objetivo) || 0;

  return (
    <article className="tarjeta" style={{ "--acento": "#e25c4f" }}>
      <header className="tarjeta-cab">
        <h2>Dieta</h2>
        <button className="tarjeta-link" onClick={() => ir("dieta")}>Ver día</button>
      </header>

      {items.filas.length === 0 ? (
        <p className="tarjeta-vacio">Todavía no cargaste nada hoy.</p>
      ) : (
        <>
          <p className="tarjeta-dato">
            {numero(total.kcal)}
            {objetivoKcal > 0 && <span className="tarjeta-de"> de {numero(objetivoKcal)}</span>} kcal
          </p>
          {objetivoKcal > 0 && (
            <Progreso valor={total.kcal} maximo={objetivoKcal} color="#e25c4f" />
          )}
          <p className="tarjeta-sub">
            {MACROS.filter((m) => m.id !== "kcal")
              .map((m) => `${m.nombre} ${numero(total[m.id], 0)} g`)
              .join(" · ")}
          </p>
        </>
      )}
    </article>
  );
}
