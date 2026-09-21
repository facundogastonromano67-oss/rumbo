import { crearStore } from "../../core/datos.js";
import { hoyISO } from "../../core/fecha.js";

export const movimientosStore = crearStore("movimientos", { orden: "fecha", asc: false });
export const categoriasStore = crearStore("categorias", { orden: "nombre", asc: true });
export const vencimientosStore = crearStore("vencimientos", { orden: "dia_mes", asc: true });

export const MEDIOS = ["efectivo", "débito", "crédito", "transferencia"];

export function primerDiaDe(mes) {
  return mes + "-01";
}

export function ultimoDiaDe(mes) {
  const [a, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, "0")}`;
}

export function mesAnterior(mes) {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

export function mesSiguiente(mes) {
  const [a, m] = mes.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}

export function rotuloMes(mes) {
  const nombres = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [a, m] = mes.split("-").map(Number);
  return `${nombres[m - 1]} ${a}`;
}

export function totales(movimientos) {
  let ingresos = 0;
  let egresos = 0;
  for (const m of movimientos) {
    const monto = Number(m.monto) || 0;
    if (m.tipo === "ingreso") ingresos += monto;
    else egresos += monto;
  }
  return { ingresos, egresos, balance: ingresos - egresos };
}

/** Egresos agrupados por categoría, de mayor a menor. */
export function porCategoria(movimientos, categorias) {
  const nombre = Object.fromEntries(categorias.map((c) => [c.id, c]));
  const acum = new Map();

  for (const m of movimientos) {
    if (m.tipo !== "egreso") continue;
    const clave = m.categoria_id || "sin";
    const previo = acum.get(clave) || {
      id: clave,
      nombre: nombre[m.categoria_id]?.nombre || "Sin categoría",
      color: nombre[m.categoria_id]?.color || "#7f8fa6",
      total: 0,
    };
    previo.total += Number(m.monto) || 0;
    acum.set(clave, previo);
  }

  return [...acum.values()].sort((a, b) => b.total - a.total);
}

export function estaPagado(vencimiento, mes) {
  return !!vencimiento.pagado_hasta && vencimiento.pagado_hasta >= primerDiaDe(mes);
}

/**
 * Vencimientos del mes que todavía no se pagaron, ordenados por cercanía.
 * `dias` es cuánto falta: negativo si ya pasó la fecha dentro de este mes.
 */
export function porVencer(vencimientos, mes, hoy = hoyISO()) {
  const diaHoy = Number(hoy.slice(8, 10));
  const esMesActual = mes === hoy.slice(0, 7);

  return vencimientos
    .filter((v) => v.activo && !estaPagado(v, mes))
    .map((v) => ({ ...v, dias: esMesActual ? v.dia_mes - diaHoy : null }))
    .sort((a, b) => a.dia_mes - b.dia_mes);
}
