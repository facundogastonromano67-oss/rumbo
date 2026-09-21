/** Fechas en formato "YYYY-MM-DD", siempre en hora local (nunca UTC: un toISOString()
 *  a la noche devuelve el día siguiente y arruina las rachas de hábitos). */

export function hoyISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export function desdeISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(iso, n) {
  const d = desdeISO(iso);
  d.setDate(d.getDate() + n);
  return hoyISO(d);
}

/** 0 = lunes ... 6 = domingo. Distinto de getDay(), que arranca en domingo. */
export function diaSemana(iso) {
  return (desdeISO(iso).getDay() + 6) % 7;
}

export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DIAS_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Lunes de la semana que contiene a `iso`. */
export function inicioSemana(iso) {
  return sumarDias(iso, -diaSemana(iso));
}

export function semanaDe(iso) {
  const lunes = inicioSemana(iso);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

export function mesDe(iso) {
  return iso.slice(0, 7);
}

export function nombreMes(iso) {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return meses[Number(iso.slice(5, 7)) - 1];
}

/** "hoy", "ayer", "mañana" o "12 mar" — para listas donde la fecha exacta estorba. */
export function fechaRelativa(iso, hoy = hoyISO()) {
  if (iso === hoy) return "hoy";
  if (iso === sumarDias(hoy, -1)) return "ayer";
  if (iso === sumarDias(hoy, 1)) return "mañana";
  const d = desdeISO(iso);
  const mesesCortos = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const conAnio = d.getFullYear() !== new Date().getFullYear();
  return `${d.getDate()} ${mesesCortos[d.getMonth()]}${conAnio ? " " + d.getFullYear() : ""}`;
}

export function diasEntre(desde, hasta) {
  return Math.round((desdeISO(hasta) - desdeISO(desde)) / 86400000);
}

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "25 de julio, 2026" */
export function fechaLarga(iso) {
  const d = desdeISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]}, ${d.getFullYear()}`;
}

/**
 * Diferencia en años, meses y días entre dos fechas.
 * Se calcula por calendario, no dividiendo días por 30: restar los meses y
 * pedir prestados los días del mes anterior es lo único que da el resultado
 * que una persona espera ver.
 */
export function edadDetallada(desde, hasta = hoyISO()) {
  const a = desdeISO(desde);
  const b = desdeISO(hasta);
  if (b < a) return { anios: 0, meses: 0, dias: 0 };

  let anios = b.getFullYear() - a.getFullYear();
  let meses = b.getMonth() - a.getMonth();
  if (b.getDate() < a.getDate()) meses--;
  if (meses < 0) {
    meses += 12;
    anios--;
  }

  // Los días se miden contra un "ancla": la fecha de origen corrida esos años y
  // meses. Restar el día del mes directamente falla cuando el origen cae 31 y el
  // mes de llegada tiene 28, así que el ancla se recorta al último día del mes.
  const corridos = a.getMonth() + anios * 12 + meses;
  const anio = a.getFullYear() + Math.floor(corridos / 12);
  const mes = ((corridos % 12) + 12) % 12;
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const ancla = new Date(anio, mes, Math.min(a.getDate(), ultimoDia));

  const dias = Math.round((b - ancla) / 86400000);
  return { anios, meses, dias };
}

/** "34 años, 1 mes y 15 días" */
export function textoEdad(desde, hasta = hoyISO()) {
  const { anios, meses, dias } = edadDetallada(desde, hasta);
  const partes = [];
  if (anios) partes.push(`${anios} ${anios === 1 ? "año" : "años"}`);
  if (meses) partes.push(`${meses} ${meses === 1 ? "mes" : "meses"}`);
  // Los días solo se nombran si aportan algo: "34 años", no "34 años y 0 días".
  if (dias || !partes.length) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);

  if (partes.length === 1) return partes[0];
  return partes.slice(0, -1).join(", ") + " y " + partes[partes.length - 1];
}
