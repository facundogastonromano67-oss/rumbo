import { NIVELES_ACTIVIDAD, OBJETIVOS } from "../../core/salud.js";
import { edadDetallada } from "../../core/fecha.js";

/**
 * De los datos del cuerpo a los objetivos del día.
 *
 * Gasto en reposo por Mifflin-St Jeor, que es la fórmula con menos error
 * promedio en población general. Después se multiplica por la actividad y se
 * ajusta por el objetivo.
 *
 * Ojo: esto es una estimación, no una medición. El número real se ajusta
 * mirando el peso durante dos o tres semanas, no recalculando la fórmula.
 */

export function edadEnAnios(perfil, hoy) {
  if (!perfil?.fecha_nacimiento) return null;
  return edadDetallada(perfil.fecha_nacimiento, hoy).anios;
}

/** Gasto en reposo (kcal/día). */
export function gastoEnReposo(perfil, hoy) {
  const edad = edadEnAnios(perfil, hoy);
  const peso = Number(perfil?.peso_kg);
  const altura = Number(perfil?.altura_cm);
  if (!edad || !peso || !altura || !perfil?.sexo) return null;

  const base = 10 * peso + 6.25 * altura - 5 * edad;
  return Math.round(perfil.sexo === "masculino" ? base + 5 : base - 161);
}

/** Gasto total: reposo por el factor de actividad. */
export function gastoTotal(perfil, hoy) {
  const reposo = gastoEnReposo(perfil, hoy);
  if (!reposo) return null;
  const nivel = NIVELES_ACTIVIDAD.find((n) => n.id === perfil.nivel_actividad) ?? NIVELES_ACTIVIDAD[2];
  return Math.round(reposo * nivel.factor);
}

/**
 * Objetivos diarios de calorías y macros.
 *
 * El orden importa: primero la proteína (por kilo de peso, es lo que sostiene
 * el músculo), después la grasa (mínimo hormonal), y los carbohidratos se
 * quedan con lo que sobra. Es el reparto que usa cualquier planificación seria.
 */
export function objetivosDiarios(perfil, hoy) {
  const total = gastoTotal(perfil, hoy);
  if (!total) return null;

  const objetivo = OBJETIVOS.find((o) => o.id === perfil.objetivo) ?? OBJETIVOS[1];
  const kcal = Math.round(total * (1 + objetivo.ajuste));
  const peso = Number(perfil.peso_kg);

  // Proteína por kilo. En déficit sube, porque es cuando más hay que proteger
  // el músculo que ya está.
  const gPorKilo = { bajar: 2.2, mantener: 1.8, subir: 2.0 }[objetivo.id] ?? 1.8;

  // Tope del 40% de las calorías. Los gramos por kilo de peso TOTAL se pasan
  // cuando hay mucha grasa corporal: la proteína la necesita el músculo, no el
  // tejido graso. Sin este tope, una persona de 105 kg en déficit terminaba con
  // la proteína ocupándole la mitad del día y sin lugar para nada más.
  const prot = Math.round(Math.min(peso * gPorKilo, (kcal * 0.4) / 4));

  // Grasa: 0,8 g/kg, pero nunca por debajo del 20% de las calorías.
  const grasMinima = (kcal * 0.2) / 9;
  const gras = Math.round(Math.max(peso * 0.8, grasMinima));

  // Los carbohidratos son el resto. Si el déficit es tan grande que no queda
  // nada, se recorta la grasa antes que la proteína.
  let carb = Math.round((kcal - prot * 4 - gras * 9) / 4);
  let grasFinal = gras;
  if (carb < 50) {
    const falta = (50 - carb) * 4;
    grasFinal = Math.max(Math.round(peso * 0.5), Math.round(gras - falta / 9));
    carb = Math.round((kcal - prot * 4 - grasFinal * 9) / 4);
  }

  return {
    reposo: gastoEnReposo(perfil, hoy),
    total,
    kcal,
    prot,
    carb: Math.max(0, carb),
    gras: grasFinal,
    objetivo: objetivo.id,
  };
}

/** Cuánto aporta cada macro al total, para mostrarlo como porcentaje. */
export function reparto({ kcal, prot, carb, gras }) {
  if (!kcal) return { prot: 0, carb: 0, gras: 0 };
  return {
    prot: Math.round(((prot * 4) / kcal) * 100),
    carb: Math.round(((carb * 4) / kcal) * 100),
    gras: Math.round(((gras * 9) / kcal) * 100),
  };
}
