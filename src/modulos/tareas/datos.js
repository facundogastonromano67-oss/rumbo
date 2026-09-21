import { crearStore } from "../../core/datos.js";
import { hoyISO } from "../../core/fecha.js";

export const tareasStore = crearStore("tareas", { orden: "created_at", asc: false });
export const proyectosStore = crearStore("proyectos", { orden: "nombre", asc: true });

export const PRIORIDADES = [
  { valor: 0, nombre: "Baja", color: "#7f8fa6" },
  { valor: 1, nombre: "Normal", color: "#6c8cff" },
  { valor: 2, nombre: "Alta", color: "#d96f6f" },
];

/** Reparte las tareas en los grupos que se muestran en pantalla. */
export function agrupar(tareas, hoy = hoyISO()) {
  const grupos = { vencidas: [], hoy: [], proximas: [], sinFecha: [], hechas: [] };

  for (const t of tareas) {
    if (t.hecha) grupos.hechas.push(t);
    else if (!t.vence_el) grupos.sinFecha.push(t);
    else if (t.vence_el < hoy) grupos.vencidas.push(t);
    else if (t.vence_el === hoy) grupos.hoy.push(t);
    else grupos.proximas.push(t);
  }

  const porFecha = (a, b) =>
    (a.vence_el || "").localeCompare(b.vence_el || "") || b.prioridad - a.prioridad;
  const porPrioridad = (a, b) =>
    b.prioridad - a.prioridad || (b.created_at || "").localeCompare(a.created_at || "");

  grupos.vencidas.sort(porFecha);
  grupos.hoy.sort(porPrioridad);
  grupos.proximas.sort(porFecha);
  grupos.sinFecha.sort(porPrioridad);
  grupos.hechas.sort((a, b) => (b.hecha_el || "").localeCompare(a.hecha_el || ""));

  return grupos;
}

/** Lo que hay que hacer hoy: vencidas + de hoy. Lo usa el resumen y la pantalla. */
export function pendientesDeHoy(tareas, hoy = hoyISO()) {
  return tareas.filter((t) => !t.hecha && t.vence_el && t.vence_el <= hoy);
}
