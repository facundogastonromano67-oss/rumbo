import { Layout } from "./Layout.jsx";
import { MODULOS, moduloPorId } from "./registro.js";
import { useRuta } from "./rutas.js";
import { Hoy } from "./Hoy.jsx";
import { PantallaAcceso, useSesion } from "../core/auth.jsx";
import { Cargando, Vacio } from "../core/ui/index.jsx";
import { sinConfigurar } from "../core/supabase.js";
import { FaltaConfigurar } from "./FaltaConfigurar.jsx";

export default function App() {
  if (sinConfigurar) return <FaltaConfigurar />;
  return <Contenido />;
}

function Contenido() {
  const { sesion, cargando } = useSesion();
  const ruta = useRuta();

  if (cargando) return <div className="pantalla-centro"><Cargando texto="Abriendo tu Rumbo..." /></div>;
  if (!sesion) return <PantallaAcceso />;

  const modulo = moduloPorId(ruta);

  return (
    <Layout>
      {ruta === "hoy" ? (
        <Hoy />
      ) : modulo ? (
        <modulo.Pantalla />
      ) : (
        <Vacio
          icono="?"
          titulo="No encontramos esa sección"
          texto={`La ruta "${ruta}" no corresponde a ningún módulo.`}
        />
      )}
    </Layout>
  );
}

export { MODULOS };
