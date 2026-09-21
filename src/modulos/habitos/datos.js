import { crearStore } from "../../core/datos.js";
import { diaSemana, hoyISO, sumarDias } from "../../core/fecha.js";

export const habitosStore = crearStore("habitos", { orden: "created_at", asc: true });
export const registrosStore = crearStore("habito_registros", { orden: "fecha", asc: false });

/** Cuántos días de historial se bajan. Más que esto no aporta a ninguna vista. */
export const DIAS_HISTORIAL = 120;

export function desdeCuando() {
  return sumarDias(hoyISO(), -DIAS_HISTORIAL);
}

/** Índice "habito_id|fecha" -> registro, para no recorrer el array en cada celda. */
export function indexar(registros) {
  const m = new Map();
  for (const r of registros) m.set(r.habito_id + "|" + r.fecha, r);
  return m;
}

export function tocaEseDia(habito, fecha) {
  return habito.dias.includes(diaSemana(fecha));
}

export function cumplido(habito, registro) {
  return Number(registro?.valor || 0) >= Number(habito.meta_diaria || 1);
}

/**
 * Racha: días seguidos cumplidos, contando solo los días en que el hábito toca.
 * El día de hoy no corta la racha si todavía no se hizo — recién la corta mañana,
 * porque si no toda racha se vería rota cada mañana al abrir la app.
 */
export function racha(habito, indice, hoy = hoyISO()) {
  let cuenta = 0;
  let fecha = hoy;

  if (tocaEseDia(habito, hoy) && !cumplido(habito, indice.get(habito.id + "|" + hoy))) {
    fecha = sumarDias(hoy, -1);
  }

  for (let i = 0; i < DIAS_HISTORIAL; i++) {
    if (tocaEseDia(habito, fecha)) {
      if (!cumplido(habito, indice.get(habito.id + "|" + fecha))) break;
      cuenta++;
    }
    fecha = sumarDias(fecha, -1);
  }
  return cuenta;
}

/** Porcentaje de días cumplidos sobre los días que tocaba, en una ventana. */
export function adherencia(habito, indice, dias = 30, hoy = hoyISO()) {
  let tocaba = 0;
  let hechos = 0;
  for (let i = 0; i < dias; i++) {
    const f = sumarDias(hoy, -i);
    if (f < habito.created_at?.slice(0, 10)) break;
    if (!tocaEseDia(habito, f)) continue;
    tocaba++;
    if (cumplido(habito, indice.get(habito.id + "|" + f))) hechos++;
  }
  return tocaba ? Math.round((hechos / tocaba) * 100) : null;
}

export function habitosDeHoy(habitos, hoy = hoyISO()) {
  return habitos.filter((h) => h.activo && tocaEseDia(h, hoy));
}
