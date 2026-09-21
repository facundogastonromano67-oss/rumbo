const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function plata(n) {
  return pesos.format(Number(n) || 0);
}

export function numero(n, decimales = 0) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number(n) || 0);
}

export function hora(hhmm) {
  return (hhmm || "").slice(0, 5);
}

/** Genera un id local para poder pintar en pantalla antes de que conteste la base. */
export function idLocal() {
  return crypto.randomUUID();
}
