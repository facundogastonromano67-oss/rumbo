import { useEffect, useRef, useState } from "react";

/** Piezas compartidas. Si un módulo necesita algo visual que no está acá,
 *  primero mirá si conviene agregarlo acá para que lo usen todos. */

export function Modal({ titulo, children, alCerrar, ancho = 480, pie }) {
  const caja = useRef(null);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && alCerrar();
    document.addEventListener("keydown", esc);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = previo;
    };
  }, [alCerrar]);

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div className="modal" style={{ maxWidth: ancho }} ref={caja} role="dialog" aria-modal="true">
        <header className="modal-cab">
          <h2>{titulo}</h2>
          <button className="modal-x" onClick={alCerrar} aria-label="Cerrar">×</button>
        </header>
        <div className="modal-cuerpo">{children}</div>
        {pie && <footer className="modal-pie">{pie}</footer>}
      </div>
    </div>
  );
}

export function Campo({ etiqueta, children, ayuda, ancho }) {
  return (
    <label className="campo" style={ancho ? { flex: `1 1 ${ancho}px` } : undefined}>
      <span>{etiqueta}</span>
      {children}
      {ayuda && <small className="campo-ayuda">{ayuda}</small>}
    </label>
  );
}

export function Fila({ children, ...resto }) {
  return <div className="fila" {...resto}>{children}</div>;
}

export function Vacio({ icono = "◦", titulo, texto, accion }) {
  return (
    <div className="vacio">
      <div className="vacio-icono" aria-hidden="true">{icono}</div>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {accion}
    </div>
  );
}

export function Cargando({ texto = "Cargando..." }) {
  return <div className="cargando"><span className="spinner" />{texto}</div>;
}

export function ErrorCaja({ error, alReintentar }) {
  if (!error) return null;
  return (
    <div className="error-caja">
      <strong>No se pudo cargar</strong>
      <p>{error.message || String(error)}</p>
      {alReintentar && <button className="btn" onClick={alReintentar}>Reintentar</button>}
    </div>
  );
}

export function Chip({ children, color, activo, ...resto }) {
  return (
    <button type="button" className={"chip" + (activo ? " chip-activo" : "")}
      style={color ? { "--chip": color } : undefined} {...resto}>
      {children}
    </button>
  );
}

export function Progreso({ valor, maximo = 100, color }) {
  const pct = maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0;
  return (
    <div className="progreso" role="progressbar" aria-valuenow={Math.round(pct)}>
      <div className="progreso-barra" style={{ width: pct + "%", background: color }} />
    </div>
  );
}

export function Dato({ titulo, valor, detalle, tono }) {
  return (
    <div className={"dato" + (tono ? " dato-" + tono : "")}>
      <span className="dato-titulo">{titulo}</span>
      <strong className="dato-valor">{valor}</strong>
      {detalle && <span className="dato-detalle">{detalle}</span>}
    </div>
  );
}

export function Cabecera({ titulo, subtitulo, children }) {
  return (
    <header className="cabecera">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      <div className="cabecera-acciones">{children}</div>
    </header>
  );
}

/** Confirmación para acciones que borran. Devuelve una promesa. */
export function useConfirmar() {
  const [pedido, setPedido] = useState(null);

  const confirmar = (texto, { titulo = "¿Seguro?", boton = "Borrar" } = {}) =>
    new Promise((resolver) => setPedido({ texto, titulo, boton, resolver }));

  const dialogo = pedido ? (
    <Modal titulo={pedido.titulo} ancho={380}
      alCerrar={() => { pedido.resolver(false); setPedido(null); }}>
      <p className="confirmar-texto">{pedido.texto}</p>
      <Fila>
        <button className="btn" onClick={() => { pedido.resolver(false); setPedido(null); }}>
          Cancelar
        </button>
        <button className="btn btn-peligro"
          onClick={() => { pedido.resolver(true); setPedido(null); }}>
          {pedido.boton}
        </button>
      </Fila>
    </Modal>
  ) : null;

  return { confirmar, dialogo };
}

export const COLORES = [
  "#ff7a30", "#ffa63d", "#3ea97f", "#e25c4f", "#a882e8",
  "#3fa9c9", "#d07fa8", "#7f8fa6",
];

export function SelectorColor({ valor, alCambiar }) {
  return (
    <div className="colores">
      {COLORES.map((c) => (
        <button key={c} type="button"
          className={"color" + (valor === c ? " color-activo" : "")}
          style={{ background: c }} onClick={() => alCambiar(c)}
          aria-label={"Color " + c} />
      ))}
    </div>
  );
}
