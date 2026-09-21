import { crearStore } from "../../core/datos.js";

export const sesionesStore = crearStore("sesiones", { orden: "fecha", asc: false });
export const ejerciciosStore = crearStore("ejercicios", { orden: "nombre", asc: true });
export const seriesStore = crearStore("series", { orden: "orden", asc: true });

/** Cuántas sesiones se traen. Las series se piden solo de estas, no de todo el
 *  historial: así el volumen que baja no crece con los años de uso. */
export const SESIONES_VISIBLES = 30;

export const GRUPOS = [
  "Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core", "Cardio", "Otro",
];

/** Volumen = peso x repeticiones, sumado. Es la medida más simple de "cuánto hiciste". */
export function volumen(series) {
  return series.reduce(
    (t, s) => t + (Number(s.peso) || 0) * (Number(s.repeticiones) || 0),
    0
  );
}

/** Series de una sesión, agrupadas por ejercicio y en el orden en que se cargaron. */
export function porEjercicio(series, sesionId) {
  const deLaSesion = series
    .filter((s) => s.sesion_id === sesionId)
    .sort((a, b) => a.orden - b.orden);

  const grupos = [];
  for (const s of deLaSesion) {
    let g = grupos.find((x) => x.ejercicio_id === s.ejercicio_id);
    if (!g) {
      g = { ejercicio_id: s.ejercicio_id, series: [] };
      grupos.push(g);
    }
    g.series.push(s);
  }
  return grupos;
}

/**
 * La última vez que se hizo un ejercicio, sin contar la sesión actual.
 * Sirve para saber con qué peso arrancar hoy sin tener que ir a buscarlo.
 */
export function ultimaVez(ejercicioId, series, sesiones, sesionActualId) {
  const fechaDe = Object.fromEntries(sesiones.map((s) => [s.id, s.fecha]));
  const previas = series
    .filter((s) => s.ejercicio_id === ejercicioId && s.sesion_id !== sesionActualId)
    .sort((a, b) => (fechaDe[b.sesion_id] || "").localeCompare(fechaDe[a.sesion_id] || ""));

  if (!previas.length) return null;
  const sesionId = previas[0].sesion_id;
  const delDia = previas.filter((s) => s.sesion_id === sesionId);
  return { fecha: fechaDe[sesionId], series: delDia };
}

export function resumenSerie(s) {
  const peso = Number(s.peso) || 0;
  const reps = Number(s.repeticiones) || 0;
  if (!peso) return `${reps}`;
  return `${peso}×${reps}`;
}

/* --- Plan de entrenamiento ------------------------------------------------ */

export const ejerciciosBaseStore = crearStore("ejercicios_base", { orden: "nombre", asc: true });
export const planesStore = crearStore("planes", { orden: "created_at", asc: false });
export const planDiasStore = crearStore("plan_dias", { orden: "orden", asc: true });
export const planEjerciciosStore = crearStore("plan_ejercicios", { orden: "orden", asc: true });

export const ROLES = {
  potencia: "Potencia",
  principal: "Principal",
  secundario: "Secundario",
  accesorio: "Accesorio",
  core: "Core",
  prevencion: "Prevención",
};

export function descansoTexto(segundos) {
  if (segundos >= 60) {
    const min = segundos / 60;
    return `${min % 1 === 0 ? min : min.toFixed(1).replace(".0", "")} min`;
  }
  return `${segundos} s`;
}

/**
 * Guarda un plan generado. Son tres tablas encadenadas, así que se insertan en
 * orden: el plan, después sus días, y los ejercicios de cada día en un solo
 * insert por día en vez de uno por ejercicio.
 */
export async function guardarPlan(plan) {
  const fila = await planesStore.crear({
    nombre: plan.nombre,
    deporte: plan.deporte,
    nivel: plan.nivel,
    objetivo: plan.objetivo,
    dias_semana: plan.dias_semana,
    equipo: plan.equipo,
    notas: plan.notas,
    activo: true,
  });

  for (const dia of plan.dias) {
    const filaDia = await planDiasStore.crear({
      plan_id: fila.id,
      orden: dia.orden,
      nombre: dia.nombre,
      foco: dia.foco,
      dia_semana: dia.dia_semana,
    });

    await planEjerciciosStore.crearVarias(
      dia.ejercicios.map((e, i) => ({
        plan_dia_id: filaDia.id,
        orden: i,
        nombre: e.nombre,
        patron: e.patron,
        series: e.series,
        reps_min: e.reps_min,
        reps_max: e.reps_max,
        descanso_seg: e.descanso_seg,
        nota: e.nota,
      }))
    );
  }

  return fila;
}

/**
 * Convierte un día del plan en una sesión lista para cargar pesos.
 *
 * Los ejercicios del plan son texto (se copiaron del catálogo para que el plan
 * no se rompa si el catálogo cambia), pero las series apuntan a la tabla de
 * ejercicios propios. Por eso cada nombre se busca ahí y, si no está, se crea.
 */
export async function sesionDesdeDia(dia, ejerciciosDelDia, ejerciciosPropios, fecha) {
  const sesion = await sesionesStore.crear({ fecha, nombre: dia.nombre });

  const porNombre = new Map(ejerciciosPropios.map((e) => [e.nombre.toLowerCase(), e]));
  const series = [];
  let orden = 0;

  for (const pe of ejerciciosDelDia) {
    let propio = porNombre.get(pe.nombre.toLowerCase());
    if (!propio) {
      propio = await ejerciciosStore.crear({ nombre: pe.nombre });
      porNombre.set(pe.nombre.toLowerCase(), propio);
    }
    for (let i = 0; i < pe.series; i++) {
      series.push({
        sesion_id: sesion.id,
        ejercicio_id: propio.id,
        orden: orden++,
        peso: null,
        repeticiones: pe.reps_min,
      });
    }
  }

  await seriesStore.crearVarias(series);
  return sesion;
}
