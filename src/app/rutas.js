import { useEffect, useState } from "react";

/** Router mínimo sobre el hash. Sin dependencias: para una app de este tamaño
 *  react-router es más peso del que aporta. */

export function rutaActual() {
  return (window.location.hash.replace(/^#\/?/, "") || "hoy").split("?")[0];
}

export function ir(id) {
  window.location.hash = "/" + id;
}

export function useRuta() {
  const [ruta, setRuta] = useState(rutaActual);
  useEffect(() => {
    const alCambiar = () => setRuta(rutaActual());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return ruta;
}
