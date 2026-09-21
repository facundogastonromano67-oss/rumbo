import { crearStore } from "../../core/datos.js";
import { diaSemana, hoyISO } from "../../core/fecha.js";

export const bloquesStore = crearStore("bloques_rutina", { orden: "hora_inicio", asc: true });

export function aMinutos(hora) {
  const [h, m] = (hora || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
}

export function aHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Ventana de horas que hay que dibujar: la que cubren los bloques, con margen. */
export function ventana(bloques) {
  if (!bloques.length) return { desde: 6 * 60, hasta: 23 * 60 };
  const inicios = bloques.map((b) => aMinutos(b.hora_inicio));
  const fines = bloques.map((b) => aMinutos(b.hora_fin));
  const desde = Math.max(0, Math.floor(Math.min(...inicios) / 60) * 60 - 60);
  const hasta = Math.min(24 * 60, Math.ceil(Math.max(...fines) / 60) * 60 + 60);
  return { desde, hasta: Math.max(hasta, desde + 180) };
}

export function bloquesDelDia(bloques, dia) {
  return bloques
    .filter((b) => b.dia_semana === dia)
    .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio));
}

/** Qué está pasando ahora y qué sigue, según el reloj del dispositivo. */
export function ahoraYDespues(bloques, fecha = new Date()) {
  const dia = diaSemana(hoyISO(fecha));
  const min = fecha.getHours() * 60 + fecha.getMinutes();
  const hoy = bloquesDelDia(bloques, dia);
  const ahora = hoy.find((b) => aMinutos(b.hora_inicio) <= min && min < aMinutos(b.hora_fin)) || null;
  const despues = hoy.filter((b) => aMinutos(b.hora_inicio) > min);
  return { ahora, despues, hoy };
}

/** Horas totales por día, para ver de un vistazo qué día está cargado. */
export function horasPorDia(bloques) {
  const total = Array(7).fill(0);
  for (const b of bloques) {
    total[b.dia_semana] += Math.max(0, aMinutos(b.hora_fin) - aMinutos(b.hora_inicio));
  }
  return total.map((m) => m / 60);
}
