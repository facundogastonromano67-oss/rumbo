import { MODULOS } from "./registro.js";
import { ir, useRuta } from "./rutas.js";
import { useSesion } from "../core/auth.jsx";
import { usePerfil } from "../core/perfil.jsx";
import { fechaLarga, hoyISO, textoEdad } from "../core/fecha.js";

const INICIO = { id: "hoy", nombre: "Inicio", icono: "⌂" };

export function Layout({ children }) {
  const ruta = useRuta();
  const { usuario, salir } = useSesion();
  const { perfil } = usePerfil();

  const principales = [INICIO, ...MODULOS.filter((m) => !m.secundario)];
  const secundarios = MODULOS.filter((m) => m.secundario);
  const nombre =
    perfil?.nombre || usuario?.user_metadata?.nombre || usuario?.email?.split("@")[0] || "";

  return (
    <div className="app">
      <nav className="menu">
        <div className="menu-marca">
          <span className="menu-logo" aria-hidden="true">◈</span>
          <span className="menu-nombre">Rumbo</span>
        </div>

        <div className="menu-hoy">
          <div className="menu-fecha">{fechaLarga(hoyISO())}</div>
          {perfil?.fecha_nacimiento ? (
            <p className="menu-contador">
              {textoEdad(perfil.fecha_nacimiento)}
              <br />construyendo tu mejor versión
            </p>
          ) : (
            <button className="menu-contador-link" onClick={() => ir("ajustes")}>
              Cargá tu fecha de nacimiento
            </button>
          )}
        </div>

        <ul className="menu-lista">
          {principales.map((m) => (
            <ItemMenu key={m.id} modulo={m} activo={ruta === m.id} />
          ))}
        </ul>

        {secundarios.length > 0 && (
          <>
            <div className="menu-separador" />
            <ul className="menu-lista menu-lista-fija">
              {secundarios.map((m) => (
                <ItemMenu key={m.id} modulo={m} activo={ruta === m.id} />
              ))}
            </ul>
          </>
        )}

        <div className="menu-pie">
          <span className="menu-usuario" title={usuario?.email}>{nombre}</span>
          <button className="menu-salir" onClick={salir}>Salir</button>
        </div>
      </nav>

      <main className="contenido">{children}</main>
    </div>
  );
}

function ItemMenu({ modulo, activo }) {
  return (
    <li>
      <button
        className={"menu-item" + (activo ? " menu-item-activo" : "")}
        onClick={() => ir(modulo.id)}
        aria-current={activo ? "page" : undefined}
      >
        <span className="menu-icono" aria-hidden="true">{modulo.icono}</span>
        <span className="menu-texto">{modulo.nombre}</span>
      </button>
    </li>
  );
}
