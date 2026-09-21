import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import { tareasStore, proyectosStore, agrupar, PRIORIDADES } from "./datos.js";
import { hoyISO, fechaRelativa } from "../../core/fecha.js";
import {
  Cabecera, Campo, Cargando, Chip, ErrorCaja, Fila, Modal,
  SelectorColor, Vacio, useConfirmar,
} from "../../core/ui/index.jsx";

export function Pantalla() {
  const tareas = useTabla(tareasStore);
  const proyectos = useTabla(proyectosStore);
  const { confirmar, dialogo } = useConfirmar();

  const [titulo, setTitulo] = useState("");
  const [filtro, setFiltro] = useState(null); // proyecto_id o null = todos
  const [editando, setEditando] = useState(null);
  const [verProyectos, setVerProyectos] = useState(false);
  const [verHechas, setVerHechas] = useState(false);

  const hoy = hoyISO();
  const visibles = useMemo(
    () => (filtro ? tareas.filas.filter((t) => t.proyecto_id === filtro) : tareas.filas),
    [tareas.filas, filtro]
  );
  const grupos = useMemo(() => agrupar(visibles, hoy), [visibles, hoy]);
  const pendientes = visibles.filter((t) => !t.hecha).length;

  const porId = useMemo(
    () => Object.fromEntries(proyectos.filas.map((p) => [p.id, p])),
    [proyectos.filas]
  );

  async function agregar(e) {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    setTitulo("");
    await tareas.crear({ titulo: t, proyecto_id: filtro, prioridad: 1 });
  }

  function alternar(t) {
    tareas.actualizar(t.id, {
      hecha: !t.hecha,
      hecha_el: !t.hecha ? new Date().toISOString() : null,
    });
  }

  async function borrar(t) {
    if (await confirmar(`Se va a borrar "${t.titulo}".`)) tareas.borrar(t.id);
  }

  if (tareas.cargando && !tareas.filas.length) return <Cargando />;

  return (
    <div className="pantalla">
      <Cabecera
        titulo="Tareas"
        subtitulo={pendientes === 0 ? "Nada pendiente" : `${pendientes} pendiente${pendientes === 1 ? "" : "s"}`}
      >
        <button className="btn" onClick={() => setVerProyectos(true)}>Proyectos</button>
      </Cabecera>

      <ErrorCaja error={tareas.error} alReintentar={tareas.recargar} />

      <form className="alta-rapida" onSubmit={agregar}>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="¿Qué hay que hacer?"
          aria-label="Nueva tarea"
        />
        <button className="btn btn-primario" disabled={!titulo.trim()}>Agregar</button>
      </form>

      {proyectos.filas.length > 0 && (
        <div className="chips">
          <Chip activo={filtro === null} onClick={() => setFiltro(null)}>Todos</Chip>
          {proyectos.filas
            .filter((p) => !p.archivado)
            .map((p) => (
              <Chip key={p.id} color={p.color} activo={filtro === p.id}
                onClick={() => setFiltro(filtro === p.id ? null : p.id)}>
                {p.nombre}
              </Chip>
            ))}
        </div>
      )}

      {visibles.length === 0 ? (
        <Vacio icono="✓" titulo="Sin tareas por ahora"
          texto="Escribí arriba lo primero que tengas en la cabeza." />
      ) : (
        <div className="grupos">
          <Grupo titulo="Vencidas" tono="alerta" tareas={grupos.vencidas}
            {...{ porId, alternar, setEditando, borrar, hoy }} />
          <Grupo titulo="Hoy" tareas={grupos.hoy}
            {...{ porId, alternar, setEditando, borrar, hoy }} />
          <Grupo titulo="Próximas" tareas={grupos.proximas}
            {...{ porId, alternar, setEditando, borrar, hoy }} />
          <Grupo titulo="Sin fecha" tareas={grupos.sinFecha}
            {...{ porId, alternar, setEditando, borrar, hoy }} />

          {grupos.hechas.length > 0 && (
            <section className="grupo">
              <button className="grupo-titulo grupo-plegable"
                onClick={() => setVerHechas(!verHechas)}>
                {verHechas ? "▾" : "▸"} Hechas ({grupos.hechas.length})
              </button>
              {verHechas && (
                <ul className="lista">
                  {grupos.hechas.slice(0, 50).map((t) => (
                    <ItemTarea key={t.id} tarea={t} proyecto={porId[t.proyecto_id]}
                      {...{ alternar, setEditando, borrar, hoy }} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      {editando && (
        <ModalTarea
          tarea={editando}
          proyectos={proyectos.filas}
          alGuardar={async (cambios) => {
            await tareas.actualizar(editando.id, cambios);
            setEditando(null);
          }}
          alCerrar={() => setEditando(null)}
        />
      )}

      {verProyectos && (
        <ModalProyectos proyectos={proyectos} alCerrar={() => setVerProyectos(false)} />
      )}

      {dialogo}
    </div>
  );
}

function Grupo({ titulo, tareas, tono, porId, alternar, setEditando, borrar, hoy }) {
  if (!tareas.length) return null;
  return (
    <section className="grupo">
      <h2 className={"grupo-titulo" + (tono ? " grupo-" + tono : "")}>
        {titulo} <span className="grupo-cuenta">{tareas.length}</span>
      </h2>
      <ul className="lista">
        {tareas.map((t) => (
          <ItemTarea key={t.id} tarea={t} proyecto={porId[t.proyecto_id]}
            {...{ alternar, setEditando, borrar, hoy }} />
        ))}
      </ul>
    </section>
  );
}

function ItemTarea({ tarea, proyecto, alternar, setEditando, borrar, hoy }) {
  const prio = PRIORIDADES[tarea.prioridad] ?? PRIORIDADES[1];
  const vencida = !tarea.hecha && tarea.vence_el && tarea.vence_el < hoy;

  return (
    <li className={"item" + (tarea.hecha ? " item-hecho" : "")}>
      <button className={"tilde" + (tarea.hecha ? " tilde-on" : "")}
        onClick={() => alternar(tarea)}
        aria-label={tarea.hecha ? "Marcar como pendiente" : "Marcar como hecha"}>
        {tarea.hecha ? "✓" : ""}
      </button>

      <button className="item-cuerpo" onClick={() => setEditando(tarea)}>
        <span className="item-titulo">{tarea.titulo}</span>
        <span className="item-meta">
          {proyecto && (
            <span className="etiqueta" style={{ "--chip": proyecto.color }}>{proyecto.nombre}</span>
          )}
          {tarea.vence_el && (
            <span className={"item-fecha" + (vencida ? " item-fecha-vencida" : "")}>
              {fechaRelativa(tarea.vence_el, hoy)}
            </span>
          )}
          {tarea.prioridad === 2 && <span className="item-prio" style={{ color: prio.color }}>alta</span>}
          {tarea.notas && <span className="item-nota">✎</span>}
        </span>
      </button>

      <button className="item-borrar" onClick={() => borrar(tarea)} aria-label="Borrar">×</button>
    </li>
  );
}

function ModalTarea({ tarea, proyectos, alGuardar, alCerrar }) {
  const [f, setF] = useState({
    titulo: tarea.titulo,
    notas: tarea.notas || "",
    proyecto_id: tarea.proyecto_id || "",
    prioridad: tarea.prioridad,
    vence_el: tarea.vence_el || "",
  });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));

  return (
    <Modal titulo="Editar tarea" alCerrar={alCerrar}
      pie={
        <>
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario"
            onClick={() => alGuardar({
              titulo: f.titulo.trim(),
              notas: f.notas.trim() || null,
              proyecto_id: f.proyecto_id || null,
              prioridad: Number(f.prioridad),
              vence_el: f.vence_el || null,
            })}
            disabled={!f.titulo.trim()}>
            Guardar
          </button>
        </>
      }>
      <Campo etiqueta="Título">
        <input value={f.titulo} onChange={(e) => cambiar("titulo", e.target.value)} autoFocus />
      </Campo>

      <Fila>
        <Campo etiqueta="Vence" ancho={140}>
          <input type="date" value={f.vence_el} onChange={(e) => cambiar("vence_el", e.target.value)} />
        </Campo>
        <Campo etiqueta="Prioridad" ancho={140}>
          <select value={f.prioridad} onChange={(e) => cambiar("prioridad", e.target.value)}>
            {PRIORIDADES.map((p) => <option key={p.valor} value={p.valor}>{p.nombre}</option>)}
          </select>
        </Campo>
      </Fila>

      <Campo etiqueta="Proyecto">
        <select value={f.proyecto_id} onChange={(e) => cambiar("proyecto_id", e.target.value)}>
          <option value="">Sin proyecto</option>
          {proyectos.filter((p) => !p.archivado).map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Notas">
        <textarea rows={4} value={f.notas} onChange={(e) => cambiar("notas", e.target.value)}
          placeholder="Detalles, links, lo que sea" />
      </Campo>
    </Modal>
  );
}

function ModalProyectos({ proyectos, alCerrar }) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#6c8cff");
  const { confirmar, dialogo } = useConfirmar();

  return (
    <Modal titulo="Proyectos" alCerrar={alCerrar}>
      <form className="alta-rapida" onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        proyectos.crear({ nombre: nombre.trim(), color });
        setNombre("");
      }}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del proyecto" />
        <button className="btn btn-primario" disabled={!nombre.trim()}>Crear</button>
      </form>

      <SelectorColor valor={color} alCambiar={setColor} />

      <ul className="lista lista-simple">
        {proyectos.filas.map((p) => (
          <li key={p.id} className="item">
            <span className="punto" style={{ background: p.color }} />
            <span className="item-titulo">{p.nombre}</span>
            <button className="item-borrar"
              onClick={async () => {
                if (await confirmar(
                  `Se borra el proyecto "${p.nombre}". Sus tareas quedan sin proyecto, no se borran.`
                )) proyectos.borrar(p.id);
              }}
              aria-label="Borrar proyecto">×</button>
          </li>
        ))}
        {!proyectos.filas.length && <li className="lista-nota">Todavía no hay proyectos.</li>}
      </ul>

      {dialogo}
    </Modal>
  );
}
