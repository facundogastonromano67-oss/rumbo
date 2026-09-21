import { crearStore } from "../../core/datos.js";

export const alimentosStore = crearStore("alimentos", { orden: "nombre", asc: true });
export const comidasStore = crearStore("comidas", { orden: "fecha", asc: false });
export const itemsStore = crearStore("comida_items", { orden: "created_at", asc: true });

export const MOMENTOS = [
  { id: "desayuno", nombre: "Desayuno" },
  { id: "almuerzo", nombre: "Almuerzo" },
  { id: "merienda", nombre: "Merienda" },
  { id: "cena", nombre: "Cena" },
  { id: "snack", nombre: "Snack" },
];

/**
 * Calcula los macros de una porción y los devuelve para GUARDARLOS en el item.
 * No se recalculan después leyendo el alimento: si mañana corregís las calorías
 * de un alimento, lo que comiste el mes pasado tiene que seguir diciendo lo mismo.
 */
export function macrosDe(alimento, gramos) {
  const f = (Number(gramos) || 0) / 100;
  const r = (n) => Math.round((Number(n) || 0) * f * 10) / 10;
  return {
    kcal: Math.round((Number(alimento.kcal_100) || 0) * f),
    prot: r(alimento.prot_100),
    carb: r(alimento.carb_100),
    gras: r(alimento.gras_100),
  };
}

export function sumar(items) {
  return items.reduce(
    (t, i) => ({
      kcal: t.kcal + (Number(i.kcal) || 0),
      prot: t.prot + (Number(i.prot) || 0),
      carb: t.carb + (Number(i.carb) || 0),
      gras: t.gras + (Number(i.gras) || 0),
    }),
    { kcal: 0, prot: 0, carb: 0, gras: 0 }
  );
}

export const MACROS = [
  { id: "kcal", nombre: "Calorías", unidad: "kcal", objetivo: "kcal_objetivo", color: "#e25c4f" },
  { id: "prot", nombre: "Proteína", unidad: "g", objetivo: "prot_objetivo", color: "#3ea97f" },
  { id: "carb", nombre: "Carbos", unidad: "g", objetivo: "carb_objetivo", color: "#ffa63d" },
  { id: "gras", nombre: "Grasas", unidad: "g", objetivo: "gras_objetivo", color: "#ff7a30" },
];

/** Catálogo de alimentos con su aporte nutricional, igual para todos. */
export const alimentosBaseStore = crearStore("alimentos_base", { orden: "nombre", asc: true });

/**
 * Busca en el catálogo general y en los alimentos propios a la vez.
 * Los propios van primero: si alguien se cargó su versión de un alimento, es
 * porque quiere usar la suya.
 */
export function buscarAlimentos(texto, propios, base) {
  const q = texto.trim().toLowerCase();
  const marcar = (filas, propio) => filas.map((a) => ({ ...a, propio }));
  const todos = [...marcar(propios, true), ...marcar(base, false)];
  if (!q) return todos;

  // Los que empiezan con lo buscado van antes que los que solo lo contienen.
  const empiezan = todos.filter((a) => a.nombre.toLowerCase().startsWith(q));
  const contienen = todos.filter(
    (a) => !a.nombre.toLowerCase().startsWith(q) && a.nombre.toLowerCase().includes(q)
  );
  return [...empiezan, ...contienen];
}
