import { deportePorId, equipoPorId } from "./deportes.js";

/**
 * Generador de rutinas.
 *
 * Arma el plan en tres pasos, que es como lo arma alguien que sabe:
 *   1. Elegir el reparto de la semana según cuántos días hay (no es lo mismo
 *      entrenar 2 días que 5: con 2 días no existe el día de brazos).
 *   2. Llenar cada día con PATRONES de movimiento, no con ejercicios sueltos,
 *      poniendo primero lo que el deporte prioriza y lo que exige estar fresco.
 *   3. Recién ahí elegir con qué ejercicio cubrir cada patrón, según el equipo
 *      que haya y el nivel de la persona.
 *
 * El catálogo de ejercicios entra por parámetro (sale de `ejercicios_base`),
 * así esta lógica se puede probar sin base de datos.
 */

const ORDEN_NIVEL = { principiante: 0, intermedio: 1, avanzado: 2 };

/* --- Paso 1: el reparto de la semana ------------------------------------- */

const DIA = {
  full: { nombre: "Cuerpo completo", foco: "Todo el cuerpo" },
  empuje: { nombre: "Empuje", foco: "Pecho, hombros y tríceps" },
  traccion: { nombre: "Tracción", foco: "Espalda y bíceps" },
  pierna: { nombre: "Pierna", foco: "Cuádriceps, isquios y glúteos" },
  torso: { nombre: "Torso", foco: "Todo el tren superior" },
};

function repartoSemanal(dias, nivel) {
  const principiante = nivel === "principiante";

  switch (dias) {
    case 2:
      return ["full", "full"];
    case 3:
      // Un principiante progresa más repitiendo los patrones básicos tres veces
      // por semana que partiendo el cuerpo en tres.
      return principiante ? ["full", "full", "full"] : ["empuje", "traccion", "pierna"];
    case 4:
      return ["torso", "pierna", "torso", "pierna"];
    case 5:
      return ["empuje", "traccion", "pierna", "torso", "pierna"];
    case 6:
      return ["empuje", "traccion", "pierna", "empuje", "traccion", "pierna"];
    default:
      return ["full", "full", "full"];
  }
}

/* --- Paso 2: los patrones de cada día ------------------------------------ */

const PLANTILLAS = {
  full: [
    ["rodilla", "principal"],
    ["empuje_horizontal", "principal"],
    ["traccion_horizontal", "principal"],
    ["cadera", "secundario"],
    ["empuje_vertical", "accesorio"],
    ["core_anti_extension", "core"],
  ],
  empuje: [
    ["empuje_horizontal", "principal"],
    ["empuje_vertical", "principal"],
    ["empuje_horizontal", "secundario"],
    ["hombro_lateral", "accesorio"],
    ["triceps", "accesorio"],
    ["core_anti_extension", "core"],
  ],
  traccion: [
    ["traccion_vertical", "principal"],
    ["traccion_horizontal", "principal"],
    ["traccion_horizontal", "secundario"],
    ["hombro_lateral", "accesorio"],
    ["biceps", "accesorio"],
    ["core_anti_rotacion", "core"],
  ],
  pierna: [
    ["rodilla", "principal"],
    ["cadera", "principal"],
    ["zancada", "secundario"],
    ["isquios_aislado", "accesorio"],
    ["pantorrilla", "accesorio"],
    ["core_anti_rotacion", "core"],
  ],
  torso: [
    ["empuje_horizontal", "principal"],
    ["traccion_vertical", "principal"],
    ["empuje_vertical", "secundario"],
    ["traccion_horizontal", "secundario"],
    ["hombro_lateral", "accesorio"],
    ["biceps", "accesorio"],
    ["core_anti_extension", "core"],
  ],
};

/* --- Series, repeticiones y descanso ------------------------------------- */

/** Por rol dentro del día y por objetivo del deporte. */
const ESQUEMAS = {
  potencia: { series: 4, reps: [3, 5], descanso: 150 },
  prevencion: { series: 3, reps: [10, 15], descanso: 45 },
  core: { series: 3, reps: [10, 15], descanso: 45 },

  fuerza: {
    principal: { series: 4, reps: [4, 6], descanso: 180 },
    secundario: { series: 3, reps: [6, 8], descanso: 120 },
    accesorio: { series: 3, reps: [10, 12], descanso: 60 },
  },
  hipertrofia: {
    principal: { series: 4, reps: [6, 10], descanso: 120 },
    secundario: { series: 3, reps: [8, 12], descanso: 90 },
    accesorio: { series: 3, reps: [12, 15], descanso: 60 },
  },
  potencia_obj: {
    principal: { series: 4, reps: [5, 8], descanso: 150 },
    secundario: { series: 3, reps: [8, 10], descanso: 90 },
    accesorio: { series: 3, reps: [10, 12], descanso: 60 },
  },
  resistencia: {
    principal: { series: 3, reps: [10, 12], descanso: 90 },
    secundario: { series: 3, reps: [12, 15], descanso: 60 },
    accesorio: { series: 2, reps: [15, 20], descanso: 45 },
  },
};

function esquemaDe(objetivo, rol, nivel) {
  let base;
  if (rol === "potencia") base = ESQUEMAS.potencia;
  else if (rol === "core") base = ESQUEMAS.core;
  else if (rol === "prevencion") base = ESQUEMAS.prevencion;
  else {
    const tabla = ESQUEMAS[objetivo === "potencia" ? "potencia_obj" : objetivo] ?? ESQUEMAS.hipertrofia;
    base = tabla[rol] ?? tabla.accesorio;
  }

  // El nivel mueve el volumen, no las repeticiones: un principiante necesita
  // menos series para progresar, y más series solo le cuestan recuperación.
  let series = base.series;
  if (nivel === "principiante" && rol !== "core") series = Math.max(2, series - 1);
  if (nivel === "avanzado" && (rol === "principal" || rol === "secundario")) series += 1;

  return { series, reps_min: base.reps[0], reps_max: base.reps[1], descanso_seg: base.descanso };
}

/* --- Paso 3: elegir el ejercicio ----------------------------------------- */

/**
 * Devuelve el ejercicio para un hueco, o null si no hay con qué llenarlo.
 *
 * `usados` es de todo el plan y sirve para variar entre días; `usadosDia` es
 * del día que se está armando y es una regla dura: un ejercicio no puede
 * aparecer dos veces en la misma sesión. Si no queda nada nuevo para el día,
 * el hueco se descarta — un día con cinco ejercicios distintos es mejor que uno
 * con seis donde dos son el mismo.
 */
function elegirEjercicio(catalogo, { patron, equipos, nivel, usados, usadosDia, nombre }) {
  if (nombre) {
    const exacto = catalogo.find((e) => e.nombre === nombre);
    // Un preventivo que pide equipo que no hay, o que ya salió hoy como
    // accesorio, se descarta en silencio.
    if (!exacto || !equipos.includes(exacto.equipo) || usadosDia.has(exacto.id)) return null;
    usados.add(exacto.id);
    usadosDia.add(exacto.id);
    return exacto;
  }

  const techo = ORDEN_NIVEL[nivel] ?? 0;
  const candidatos = catalogo
    .filter(
      (e) =>
        e.patron === patron &&
        equipos.includes(e.equipo) &&
        (ORDEN_NIVEL[e.nivel] ?? 0) <= techo &&
        !usadosDia.has(e.id)
    )
    // Por prioridad, no por nombre. El catálogo llega ordenado alfabéticamente
    // y sin esto el principal del día de torso salía "Aperturas con mancuernas"
    // en vez de un press de banca.
    .sort((a, b) => (a.prioridad ?? 5) - (b.prioridad ?? 5) || a.nombre.localeCompare(b.nombre));

  if (!candidatos.length) return null;

  // Entre los que quedan se prefiere uno que no haya salido en otro día, para
  // que el día B no sea una copia del día A.
  const frescos = candidatos.filter((e) => !usados.has(e.id));
  const elegido = (frescos.length ? frescos : candidatos)[0];
  usados.add(elegido.id);
  usadosDia.add(elegido.id);
  return elegido;
}

/* --- Armado del plan ----------------------------------------------------- */

/**
 * @param {object} opciones
 * @param {string} opciones.deporte   id del deporte
 * @param {string} opciones.nivel     principiante | intermedio | avanzado
 * @param {number} opciones.dias      días de gimnasio por semana (2 a 6)
 * @param {string} opciones.equipo    id del equipamiento disponible
 * @param {Array}  catalogo           filas de ejercicios_base
 */
export function generarPlan({ deporte: deporteId, nivel, dias, equipo: equipoId }, catalogo) {
  const deporte = deportePorId(deporteId);
  const equipo = equipoPorId(equipoId);
  const equipos = equipo.incluye;
  const usados = new Set();

  const reparto = repartoSemanal(dias, nivel);
  // Cuando un tipo de día se repite (Torso, Torso) se numeran A y B.
  const cuenta = {};
  const totales = reparto.reduce((t, k) => ({ ...t, [k]: (t[k] || 0) + 1 }), {});

  const diasPlan = reparto.map((clave, i) => {
    cuenta[clave] = (cuenta[clave] || 0) + 1;
    const letra = totales[clave] > 1 ? ` ${String.fromCharCode(64 + cuenta[clave])}` : "";

    let slots = PLANTILLAS[clave].map(([patron, rol]) => ({ patron, rol }));

    // El deporte reordena: lo que prioriza va primero y sube de rol.
    slots = priorizar(slots, deporte);

    // El trabajo explosivo va al principio del día, con el sistema nervioso
    // fresco. Si se hace al final, ya no es potencia: es cansancio.
    const esDiaDePierna = clave === "pierna" || clave === "full";
    if (deporte.potencia && esDiaDePierna) {
      slots.unshift({ patron: "potencia", rol: "potencia" });
    }

    // Trabajo a una pierna o un brazo: los deportes se juegan en apoyos
    // alternados, no con los dos pies clavados en el piso.
    if (deporte.unilateral && clave === "full" && !slots.some((s) => s.patron === "zancada")) {
      slots.splice(slots.length - 1, 0, { patron: "zancada", rol: "accesorio" });
    }

    // La prevención se reparte entre los días, uno por vuelta, para que no
    // quede toda junta en el primer día de la semana.
    const preventivos = deporte.prevencion.filter((_, j) => j % reparto.length === i);
    for (const nombre of preventivos) {
      slots.push({ patron: null, rol: "prevencion", nombre });
    }

    const ejercicios = [];
    const usadosDia = new Set();
    for (const slot of slots) {
      const ej = elegirEjercicio(catalogo, { ...slot, equipos, nivel, usados, usadosDia });
      if (!ej) continue; // no hay con qué cubrir ese patrón: se saltea

      const rol = rolSegunEjercicio(slot.rol, ej);
      const esquema = esquemaDe(deporte.objetivo, rol, nivel);
      ejercicios.push({
        nombre: ej.nombre,
        patron: ej.patron,
        nota: ej.notas,
        rol,
        ...esquema,
      });
    }

    return {
      orden: i,
      nombre: DIA[clave].nombre + letra,
      foco: DIA[clave].foco,
      dia_semana: null,
      ejercicios,
    };
  });

  return {
    nombre: `${deporte.nombre} · ${dias} ${dias === 1 ? "día" : "días"}`,
    deporte: deporte.id,
    nivel,
    objetivo: deporte.objetivo,
    dias_semana: dias,
    equipo: equipos,
    notas: notasDelPlan(deporte, nivel),
    dias: diasPlan,
  };
}

/** Patrones que se entrenan con movimientos compuestos y cargas altas. */
const COMPUESTOS = new Set([
  "empuje_horizontal", "empuje_vertical", "traccion_horizontal",
  "traccion_vertical", "rodilla", "cadera", "zancada",
]);

/**
 * Si para un hueco pesado lo único disponible es un ejercicio aislado, el hueco
 * baja a accesorio. Entrenando en casa con bandas puede pasar que el único
 * tirón que quede sea un face pull: se hace igual, pero a 3×12 y no a 4×5,
 * porque programar un aislado como si fuera un remo pesado no tiene sentido.
 */
function rolSegunEjercicio(rol, ejercicio) {
  const esPesado = rol === "principal" || rol === "secundario";
  const esAislado = (ejercicio.prioridad ?? 5) >= 5;
  if (esPesado && esAislado && COMPUESTOS.has(ejercicio.patron)) return "accesorio";
  return rol;
}

/** Mueve los patrones que el deporte prioriza al frente y les sube el rol. */
function priorizar(slots, deporte) {
  const puntaje = (s) => {
    const i = deporte.prioridad.indexOf(s.patron);
    return i === -1 ? 99 : i;
  };

  const promovidos = slots.map((s) => {
    if (deporte.prioridad.includes(s.patron) && s.rol === "secundario") {
      return { ...s, rol: "principal" };
    }
    return s;
  });

  // Tope de dos principales por día. Tres ejercicios pesados con descansos
  // largos en la misma sesión no se recuperan: el tercero sale peor que si
  // hubiera ido con menos carga, y encima alarga el entrenamiento de más.
  const principales = promovidos
    .map((s, i) => ({ s, i }))
    .filter((x) => x.s.rol === "principal")
    .sort((a, b) => puntaje(a.s) - puntaje(b.s) || a.i - b.i);

  for (const extra of principales.slice(2)) {
    promovidos[extra.i] = { ...promovidos[extra.i], rol: "secundario" };
  }

  // Orden estable: primero por rol, y dentro del rol, por prioridad del deporte.
  const pesoRol = { potencia: 0, principal: 1, secundario: 2, accesorio: 3, core: 4, prevencion: 5 };
  return promovidos
    .map((s, i) => ({ s, i }))
    .sort((a, b) =>
      pesoRol[a.s.rol] - pesoRol[b.s.rol] ||
      puntaje(a.s) - puntaje(b.s) ||
      a.i - b.i
    )
    .map((x) => x.s);
}

function notasDelPlan(deporte, nivel) {
  const progresion =
    deporte.objetivo === "fuerza"
      ? "Progresión: cuando completes todas las series en el tope de repeticiones, subí el peso entre 2,5 y 5 kg y volvé al piso del rango."
      : deporte.objetivo === "resistencia"
      ? "Progresión: primero sumá repeticiones dentro del rango, después peso. La calidad del movimiento manda sobre el número."
      : "Progresión: doble progresión. Subís repeticiones dentro del rango hasta llegar al tope en todas las series; recién ahí subís el peso y volvés al piso del rango.";

  const descarga =
    nivel === "principiante"
      ? "Cada 8 o 10 semanas tomate una semana más liviana (mismos ejercicios, la mitad de las series)."
      : "Cada 5 o 6 semanas hacé una semana de descarga: mismas cargas, la mitad de las series.";

  return [
    deporte.nota,
    "Entrada en calor: 5 a 10 minutos de movilidad y 2 series livianas del primer ejercicio del día.",
    progresion,
    descarga,
    "Las dos últimas repeticiones de cada serie tienen que costar. Si podrías hacer cinco más, falta peso.",
  ].join("\n\n");
}
