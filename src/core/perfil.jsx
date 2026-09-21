import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { crearStore } from "./datos.js";

// Las constantes de salud viven en salud.js: son datos, los usan los
// generadores y no tienen por que pasar por React.
export { NIVELES_ACTIVIDAD, OBJETIVOS, SEXOS, perfilCompleto } from "./salud.js";

export const perfilStore = crearStore("perfil", { orden: "created_at", asc: true });

/**
 * El perfil es una fila única por persona: datos del cuerpo, objetivos y la
 * fecha de nacimiento. Lo leen el menú, Dieta y Entrenamiento, así que vive en
 * un contexto y se consulta una sola vez por sesión, no una vez por pantalla.
 *
 * No usa el sondeo de sincronizacion.js porque no es una lista y no cambia
 * desde afuera: lo edita la propia persona.
 */

const Ctx = createContext(null);


export function ProveedorPerfil({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    perfilStore
      .listar({ limite: 1 })
      .then((filas) => vivo && setPerfil(filas[0] ?? null))
      .catch((e) => vivo && setError(e))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, []);

  const guardar = useCallback(
    async (cambios) => {
      // La primera vez todavía no existe la fila: se crea. user_id lo pone la base.
      const nuevo = perfil
        ? await perfilStore.actualizar(perfil.id, cambios)
        : await perfilStore.crear(cambios);
      setPerfil(nuevo);
      return nuevo;
    },
    [perfil]
  );

  return (
    <Ctx.Provider value={{ perfil, cargando, error, guardar }}>{children}</Ctx.Provider>
  );
}

export function usePerfil() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePerfil() fuera de <ProveedorPerfil>");
  return v;
}

