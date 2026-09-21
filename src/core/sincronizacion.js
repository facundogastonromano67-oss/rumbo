import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sondeo compartido. Un solo intervalo para toda la app: cada vuelta pregunta la
 * huella de las tablas que HAY MONTADAS en pantalla y solo baja las que cambiaron.
 *
 * Esto es lo que evita repetir el error de egreso de Decoglass, donde bajar las
 * tablas enteras cada 4 segundos consumía ~313 MB por hora y por dispositivo
 * contra un plan de 5 GB al mes.
 */

const INTERVALO_MS = 6000;
const VUELTAS_RESPALDO = 50; // cada ~5 min se baja igual, por si la huella mintió

const suscriptores = new Map(); // tabla -> Set<{ store, recargar }>
const huellas = new Map(); // tabla -> última huella conocida
let vuelta = 0;
let timer = null;

function pestanaVisible() {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

async function revisar() {
  if (!pestanaVisible()) return; // con la app atrás no se sondea nada
  vuelta++;
  const forzar = vuelta % VUELTAS_RESPALDO === 0;

  await Promise.all(
    [...suscriptores.entries()].map(async ([tabla, oyentes]) => {
      if (!oyentes.size) return;
      const { store } = [...oyentes][0];
      try {
        if (!forzar) {
          const h = await store.huella();
          if (huellas.get(tabla) === h) return; // nada cambió: no se baja nada
          huellas.set(tabla, h);
        }
        oyentes.forEach((o) => o.recargar({ silencioso: true }));
      } catch {
        // Un error de red en el sondeo no debe romper la pantalla:
        // se reintenta solo en la vuelta siguiente.
      }
    })
  );
}

function arrancar() {
  if (timer) return;
  timer = setInterval(revisar, INTERVALO_MS);
}

function parar() {
  if (timer && suscriptores.size === 0) {
    clearInterval(timer);
    timer = null;
  }
}

function suscribir(store, oyente) {
  const tabla = store.tabla;
  if (!suscriptores.has(tabla)) suscriptores.set(tabla, new Set());
  suscriptores.get(tabla).add(oyente);
  arrancar();
  return () => {
    const s = suscriptores.get(tabla);
    s?.delete(oyente);
    if (s && !s.size) suscriptores.delete(tabla);
    parar();
  };
}

/** Invalida la huella para que la próxima vuelta baje la tabla sí o sí. */
export function marcarSucia(tabla) {
  huellas.delete(tabla);
}

/**
 * Hook de datos de un módulo. Devuelve las filas y las operaciones, ya con
 * actualización optimista: la pantalla se mueve al instante y si la base
 * rechaza el cambio se revierte y se avisa.
 */
export function useTabla(store, opciones = {}) {
  const { filtros, limite, activo = true } = opciones;
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Los filtros suelen venir como objeto literal (nuevo en cada render): se
  // comparan serializados para no recargar en bucle.
  const clave = JSON.stringify(filtros ?? null) + "|" + (limite ?? "");
  const opsRef = useRef({ filtros, limite });
  opsRef.current = { filtros, limite };

  const recargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!activo) return;
      if (!silencioso) setCargando(true);
      try {
        const data = await store.listar(opsRef.current);
        setFilas(data);
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setCargando(false);
      }
    },
    [store, activo]
  );

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    // La huella se anota ANTES de la carga inicial. Al revés, un cambio ocurrido
    // entre la carga y la anotación quedaría tapado para siempre.
    (async () => {
      try {
        huellas.set(store.tabla, await store.huella());
      } catch {
        /* si falla, la primera vuelta del sondeo la recalcula */
      }
      if (vivo) recargar();
    })();
    return () => {
      vivo = false;
    };
  }, [store, clave, activo, recargar]);

  useEffect(() => {
    if (!activo) return;
    return suscribir(store, { store, recargar });
  }, [store, activo, recargar]);

  // Al volver a la pestaña se revisa enseguida, sin esperar la vuelta.
  useEffect(() => {
    const alVolver = () => pestanaVisible() && revisar();
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, []);

  const crear = useCallback(
    async (fila) => {
      const provisoria = { ...fila, id: crypto.randomUUID(), _pendiente: true };
      setFilas((f) => [provisoria, ...f]);
      try {
        const real = await store.crear(fila);
        marcarSucia(store.tabla);
        setFilas((f) => f.map((x) => (x.id === provisoria.id ? real : x)));
        return real;
      } catch (e) {
        setFilas((f) => f.filter((x) => x.id !== provisoria.id));
        setError(e);
        throw e;
      }
    },
    [store]
  );

  const actualizar = useCallback(
    async (id, cambios) => {
      const antes = filas.find((f) => f.id === id);
      setFilas((f) => f.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
      try {
        const real = await store.actualizar(id, cambios);
        marcarSucia(store.tabla);
        setFilas((f) => f.map((x) => (x.id === id ? real : x)));
        return real;
      } catch (e) {
        if (antes) setFilas((f) => f.map((x) => (x.id === id ? antes : x)));
        setError(e);
        throw e;
      }
    },
    [store, filas]
  );

  const borrar = useCallback(
    async (id) => {
      const antes = filas;
      setFilas((f) => f.filter((x) => x.id !== id));
      try {
        await store.borrar(id);
        marcarSucia(store.tabla);
      } catch (e) {
        setFilas(antes);
        setError(e);
        throw e;
      }
    },
    [store, filas]
  );

  return { filas, cargando, error, recargar, crear, actualizar, borrar, setFilas };
}
