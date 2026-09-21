/**
 * Qué necesita cada deporte del gimnasio.
 *
 * Esto no es una lista de ejercicios: es lo que hace distinta a una rutina de
 * otra. Un corredor y un jugador de rugby pueden hacer sentadilla los dos, pero
 * con cargas, repeticiones y prioridades diferentes, y con trabajo preventivo
 * distinto. Acá se declara eso y el generador lo traduce en un plan.
 *
 *   objetivo    esquema de series y repeticiones por defecto
 *   prioridad   patrones que van primero y llevan más series
 *   potencia    si arranca con trabajo explosivo (antes de cansarse)
 *   unilateral  si necesita trabajo a una pierna o un brazo
 *   prevencion  ejercicios del catálogo, por nombre, para las lesiones típicas
 *   nota        el criterio, en una línea, para que se entienda el porqué
 */

export const DEPORTES = [
  {
    id: "general",
    nombre: "Salud general",
    tipo: "general",
    objetivo: "hipertrofia",
    prioridad: ["rodilla", "cadera", "traccion_horizontal"],
    potencia: false,
    unilateral: true,
    prevencion: ["Perro-pajaro (bird dog)", "Face pull"],
    nota: "Cubrir todos los patrones de movimiento, sin sobrecargar ninguno. Es la base sobre la que después se especializa.",
  },
  {
    id: "musculacion",
    nombre: "Musculación",
    tipo: "estetico",
    objetivo: "hipertrofia",
    prioridad: ["empuje_horizontal", "traccion_vertical", "rodilla"],
    potencia: false,
    unilateral: false,
    prevencion: ["Face pull", "Rotacion externa con banda"],
    nota: "El motor es el volumen: series efectivas por grupo muscular y por semana. Entre 10 y 20 series semanales por grupo, cerca del fallo pero sin llegar siempre.",
  },
  {
    id: "powerlifting",
    nombre: "Fuerza / Powerlifting",
    tipo: "fuerza",
    objetivo: "fuerza",
    prioridad: ["rodilla", "cadera", "empuje_horizontal"],
    potencia: false,
    unilateral: false,
    prevencion: ["Face pull", "Perro-pajaro (bird dog)"],
    nota: "Todo gira alrededor de sentadilla, banca y peso muerto. Pocas repeticiones, cargas altas y descansos largos: la recuperación entre series es parte del entrenamiento.",
  },
  {
    id: "futbol",
    nombre: "Fútbol",
    tipo: "equipo",
    objetivo: "potencia",
    prioridad: ["cadera", "zancada", "core_anti_rotacion"],
    potencia: true,
    unilateral: true,
    prevencion: ["Curl nordico", "Copenhagen (aductores)", "Elevacion de talones excentrica"],
    nota: "Los isquiotibiales y los aductores son las lesiones que más partidos cuestan. El trabajo excéntrico de isquios y el Copenhagen no son opcionales: son la parte del plan que te mantiene jugando.",
  },
  {
    id: "running",
    nombre: "Running / Fondo",
    tipo: "resistencia",
    objetivo: "resistencia",
    prioridad: ["cadera", "zancada", "pantorrilla"],
    potencia: true,
    unilateral: true,
    prevencion: ["Elevacion de talones excentrica", "Curl nordico", "Plancha lateral"],
    nota: "La sala de pesas no te hace correr más rápido por sí sola: te hace aguantar más kilómetros sin romperte. Dos días de fuerza alcanzan, y nunca el día antes de una tirada larga.",
  },
  {
    id: "ciclismo",
    nombre: "Ciclismo",
    tipo: "resistencia",
    objetivo: "resistencia",
    prioridad: ["rodilla", "cadera", "core_anti_extension"],
    potencia: true,
    unilateral: true,
    prevencion: ["Perro-pajaro (bird dog)", "Plancha lateral"],
    nota: "Muchas horas en la misma posición: el trabajo de core y de cadena posterior compensa lo que la bici no entrena. Poco volumen de pesas en temporada.",
  },
  {
    id: "natacion",
    nombre: "Natación",
    tipo: "resistencia",
    objetivo: "resistencia",
    prioridad: ["traccion_vertical", "traccion_horizontal", "core_anti_extension"],
    potencia: false,
    unilateral: false,
    prevencion: ["Rotacion externa con banda", "Y-T-W en banco", "Face pull"],
    nota: "Miles de brazadas por semana sobre el mismo hombro. El trabajo de manguito rotador y de espalda alta es lo que sostiene el hombro sano.",
  },
  {
    id: "tenis_padel",
    nombre: "Tenis / Pádel",
    tipo: "raqueta",
    objetivo: "potencia",
    prioridad: ["core_anti_rotacion", "zancada", "cadera"],
    potencia: true,
    unilateral: true,
    prevencion: ["Rotacion externa con banda", "Y-T-W en banco", "Copenhagen (aductores)"],
    nota: "Es un deporte de frenar, girar y arrancar de nuevo. El core que importa es el que resiste la rotación, no el que hace abdominales.",
  },
  {
    id: "basquet",
    nombre: "Básquet",
    tipo: "equipo",
    objetivo: "potencia",
    prioridad: ["rodilla", "cadera", "zancada"],
    potencia: true,
    unilateral: true,
    prevencion: ["Curl nordico", "Elevacion de talones excentrica", "Plancha lateral"],
    nota: "Saltar y caer, muchas veces por partido. Tan importante como el salto es aprender a aterrizar: por eso los saltos al cajón se bajan caminando.",
  },
  {
    id: "voley",
    nombre: "Vóley",
    tipo: "equipo",
    objetivo: "potencia",
    prioridad: ["rodilla", "empuje_vertical", "cadera"],
    potencia: true,
    unilateral: true,
    prevencion: ["Rotacion externa con banda", "Y-T-W en banco", "Elevacion de talones excentrica"],
    nota: "Salto y remate: potencia de piernas y un hombro preparado para miles de golpes por encima de la cabeza.",
  },
  {
    id: "handball",
    nombre: "Handball",
    tipo: "equipo",
    objetivo: "potencia",
    prioridad: ["core_anti_rotacion", "cadera", "empuje_vertical"],
    potencia: true,
    unilateral: true,
    prevencion: ["Rotacion externa con banda", "Copenhagen (aductores)", "Curl nordico"],
    nota: "Lanzamiento con salto y contacto. La fuerza se transmite desde las piernas al brazo a través del core: entrenar el eslabón del medio es lo que suma metros al tiro.",
  },
  {
    id: "rugby",
    nombre: "Rugby",
    tipo: "contacto",
    objetivo: "fuerza",
    prioridad: ["rodilla", "cadera", "empuje_horizontal"],
    potencia: true,
    unilateral: true,
    prevencion: ["Curl nordico", "Face pull", "Perro-pajaro (bird dog)"],
    nota: "Fuerza máxima y masa muscular, con potencia para el choque. El cuello y la espalda alta merecen trabajo propio por el contacto.",
  },
  {
    id: "boxeo_mma",
    nombre: "Boxeo / MMA",
    tipo: "combate",
    objetivo: "potencia",
    prioridad: ["core_anti_rotacion", "cadera", "empuje_horizontal"],
    potencia: true,
    unilateral: true,
    prevencion: ["Rotacion externa con banda", "Face pull", "Plancha lateral"],
    nota: "El golpe sale del piso y pasa por la cadera. Nada de series largas hasta el agotamiento: eso ya lo da el entrenamiento del deporte.",
  },
  {
    id: "crossfit",
    nombre: "Crossfit / Funcional",
    tipo: "mixto",
    objetivo: "potencia",
    prioridad: ["cadera", "rodilla", "traccion_vertical"],
    potencia: true,
    unilateral: true,
    prevencion: ["Rotacion externa con banda", "Perro-pajaro (bird dog)"],
    nota: "Fuerza primero, acondicionamiento después. Separar los días de fuerza pesada de los metcones evita que una cosa arruine a la otra.",
  },
  {
    id: "calistenia",
    nombre: "Calistenia",
    tipo: "peso_corporal",
    objetivo: "hipertrofia",
    prioridad: ["traccion_vertical", "empuje_horizontal", "core_anti_extension"],
    potencia: false,
    unilateral: true,
    prevencion: ["Rotacion externa con banda", "Face pull"],
    nota: "La progresión no es agregar peso sino hacer el movimiento más difícil: cambiar el ángulo, el apoyo o la palanca.",
  },
];

export function deportePorId(id) {
  return DEPORTES.find((d) => d.id === id) || DEPORTES[0];
}

export const NIVELES = [
  { id: "principiante", nombre: "Principiante", detalle: "Menos de 1 año entrenando" },
  { id: "intermedio", nombre: "Intermedio", detalle: "Entre 1 y 3 años, técnica armada" },
  { id: "avanzado", nombre: "Avanzado", detalle: "Más de 3 años entrenando en serio" },
];

/** Qué hay a mano. Define de qué ejercicios puede tirar el generador. */
export const EQUIPOS = [
  {
    id: "gimnasio",
    nombre: "Gimnasio completo",
    detalle: "Barras, máquinas y poleas",
    incluye: ["barra", "mancuernas", "maquina", "polea", "peso_corporal", "kettlebell", "banda", "cardio", "otro"],
  },
  {
    id: "basico",
    nombre: "Mancuernas en casa",
    detalle: "Mancuernas, banco, bandas",
    incluye: ["mancuernas", "kettlebell", "peso_corporal", "banda", "otro"],
  },
  {
    id: "casa",
    nombre: "Solo peso corporal",
    detalle: "Sin equipamiento",
    incluye: ["peso_corporal", "banda", "otro"],
  },
];

export function equipoPorId(id) {
  return EQUIPOS.find((e) => e.id === id) || EQUIPOS[0];
}
