/**
 * Constantes de salud compartidas. Son datos, no interfaz: viven fuera de
 * perfil.jsx para que los generadores (y sus tests) las puedan usar sin
 * arrastrar React.
 */

export const NIVELES_ACTIVIDAD = [
  { id: "sedentario", nombre: "Sedentario", detalle: "Trabajo sentado, sin ejercicio", factor: 1.2 },
  { id: "ligero", nombre: "Ligero", detalle: "Ejercicio suave 1 a 3 días", factor: 1.375 },
  { id: "moderado", nombre: "Moderado", detalle: "Ejercicio 3 a 5 días", factor: 1.55 },
  { id: "alto", nombre: "Alto", detalle: "Ejercicio intenso 6 a 7 días", factor: 1.725 },
  { id: "atleta", nombre: "Muy alto", detalle: "Doble turno o trabajo físico", factor: 1.9 },
];

export const OBJETIVOS = [
  { id: "bajar", nombre: "Bajar grasa", ajuste: -0.2 },
  { id: "mantener", nombre: "Mantener", ajuste: 0 },
  { id: "subir", nombre: "Ganar músculo", ajuste: 0.12 },
];

export const SEXOS = [
  { id: "masculino", nombre: "Masculino" },
  { id: "femenino", nombre: "Femenino" },
];

/** Datos mínimos que necesitan los generadores de rutina y de dieta. */
export function perfilCompleto(perfil) {
  return !!(perfil?.fecha_nacimiento && perfil?.sexo && perfil?.altura_cm && perfil?.peso_kg);
}
