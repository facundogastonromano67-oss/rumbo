import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import {
  sesionesStore, ejerciciosStore, seriesStore,
  SESIONES_VISIBLES, GRUPOS, volumen, porEjercicio, ultimaVez, resumenSerie,
} from "./datos.js";
import { hoyISO, fechaRelativa } from "../../core/fecha.js";
import { numero } from "../../core/formato.js";
import {
  Cabecera, Campo, Cargando, ErrorCaja, Fila, Modal, Vacio, useConfirmar,
} from "../../core/ui/index.jsx";
import { Plan } from "./Plan.jsx";

export function Pantalla() {
  const sesiones = useTabla(sesionesStore, { limite: SESIONES_VISIBLES });
  const ejercicios = useTabla(ejerciciosStore);
  const { confirmar, dialogo } = useConfirmar();

  const idsSesion = useMemo(() => sesiones.filas.map((s) => s.id), [sesiones.filas]);
  const series = useTabla(seriesStore, {
    filtros: { sesion_id: idsSesion },
    activo: idsSesion.length > 0,
  });

  const [abierta, setAbierta] = useState(null);
  const [verEjercicios, setVerEjercicios] = useState(false);
  const [vista, setVista] = useState("plan");

  const sesion = sesiones.filas.find((s) => s.id === abierta) || null;

  /** Al crear una sesión desde el plan, se salta al historial con esa abierta. */
  async function abrirSesionNueva(id) {
    // También se recargan los ejercicios: armar la sesión pudo crear los que
    // faltaban, y se insertan directo contra el store, sin pasar por el hook.
    // Sin esto, los ejercicios nuevos salen en pantalla como "Ejercicio".
    await Promise.all([sesiones.recargar(), ejercicios.recargar()]);
    setAbierta(id);
    setVista("sesiones");
  }

  async function nuevaSesion() {
    const s = await sesiones.crear({ fecha: hoyISO(), nombre: "Entrenamiento" });
    setAbierta(s.id);
  }

  if (sesiones.cargando && !sesiones.filas.length) return <Cargando />;

  return (
    <div className="pantalla">
      <Cabecera titulo="Entrenamiento"
        subtitulo={sesiones.filas.length
          ? `${sesiones.filas.length} ${sesiones.filas.length === 1 ? "sesión registrada" : "sesiones registradas"}`
          : null}>
        <button className="btn" onClick={() => setVerEjercicios(true)}>Ejercicios</button>
        <button className="btn btn-primario" onClick={nuevaSesion}>Nueva sesión</button>
      </Cabecera>

      <div className="solapas">
        <button className={"solapa" + (vista === "plan" ? " solapa-activa" : "")}
          onClick={() => setVista("plan")}>Mi rutina</button>
        <button className={"solapa" + (vista === "sesiones" ? " solapa-activa" : "")}
          onClick={() => setVista("sesiones")}>Historial</button>
      </div>

      {vista === "plan" && <Plan alAbrirSesion={abrirSesionNueva} />}

      {vista === "sesiones" && <>
      <ErrorCaja error={sesiones.error || series.error} alReintentar={sesiones.recargar} />

      {sesiones.filas.length === 0 ? (
        <Vacio icono="⟡" titulo="Todavía no entrenaste acá"
          texto="Creá una sesión y cargale los ejercicios que hiciste."
          accion={<button className="btn btn-primario" onClick={nuevaSesion}>Empezar una sesión</button>} />
      ) : (
        <div className="dos-columnas">
          <ul className="lista lista-sesiones">
            {sesiones.filas.map((s) => {
              const suyas = series.filas.filter((x) => x.sesion_id === s.id);
              return (
                <li key={s.id}>
                  <button className={"sesion" + (abierta === s.id ? " sesion-activa" : "")}
                    onClick={() => setAbierta(abierta === s.id ? null : s.id)}>
                    <span className="sesion-fecha">{fechaRelativa(s.fecha)}</span>
                    <span className="sesion-nombre">{s.nombre}</span>
                    <span className="sesion-meta">
                      {suyas.length} {suyas.length === 1 ? "serie" : "series"} · {numero(volumen(suyas))} kg
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="detalle">
            {sesion ? (
              <DetalleSesion
                sesion={sesion} sesiones={sesiones} series={series}
                ejercicios={ejercicios} confirmar={confirmar}
                alCerrar={() => setAbierta(null)}
              />
            ) : (
              <p className="pista">Elegí una sesión de la izquierda para verla o editarla.</p>
            )}
          </div>
        </div>
      )}
      </>}

      {verEjercicios && (
        <ModalEjercicios ejercicios={ejercicios} alCerrar={() => setVerEjercicios(false)} />
      )}

      {dialogo}
    </div>
  );
}

function DetalleSesion({ sesion, sesiones, series, ejercicios, confirmar, alCerrar }) {
  const [agregando, setAgregando] = useState(false);
  const grupos = useMemo(
    () => porEjercicio(series.filas, sesion.id),
    [series.filas, sesion.id]
  );
  const nombreEj = useMemo(
    () => Object.fromEntries(ejercicios.filas.map((e) => [e.id, e.nombre])),
    [ejercicios.filas]
  );
  const suyas = series.filas.filter((s) => s.sesion_id === sesion.id);

  async function agregarSerie(ejercicioId, datos) {
    const orden = suyas.length ? Math.max(...suyas.map((s) => s.orden)) + 1 : 0;
    await series.crear({ sesion_id: sesion.id, ejercicio_id: ejercicioId, orden, ...datos });
  }

  return (
    <div className="sesion-detalle">
      <header className="sesion-detalle-cab">
        <input className="titulo-editable" value={sesion.nombre}
          onChange={(e) => sesiones.actualizar(sesion.id, { nombre: e.target.value })} />
        <input type="date" value={sesion.fecha}
          onChange={(e) => sesiones.actualizar(sesion.id, { fecha: e.target.value })} />
        <button className="btn btn-chico" onClick={alCerrar}>Cerrar</button>
      </header>

      <div className="sesion-datos">
        <span>{suyas.length} {suyas.length === 1 ? "serie" : "series"}</span>
        <span>{numero(volumen(suyas))} kg de volumen</span>
        <label className="duracion">
          <input type="number" min={0} placeholder="—"
            value={sesion.duracion_min ?? ""}
            onChange={(e) =>
              sesiones.actualizar(sesion.id, {
                duracion_min: e.target.value === "" ? null : Number(e.target.value),
              })
            } />
          min
        </label>
      </div>

      {grupos.length === 0 && <p className="pista">Sumá el primer ejercicio de esta sesión.</p>}

      {grupos.map((g) => {
        const previa = ultimaVez(g.ejercicio_id, series.filas, sesiones.filas, sesion.id);
        return (
          <section key={g.ejercicio_id} className="ejercicio">
            <header className="ejercicio-cab">
              <h3>{nombreEj[g.ejercicio_id] || "Ejercicio"}</h3>
              {previa && (
                <small className="ejercicio-previa">
                  {fechaRelativa(previa.fecha)}: {previa.series.map(resumenSerie).join(" · ")}
                </small>
              )}
            </header>

            <ul className="series">
              {g.series.map((s, i) => (
                <li key={s.id} className="serie">
                  <span className="serie-n">{i + 1}</span>
                  <input type="number" step="0.5" value={s.peso ?? ""} placeholder="kg"
                    onChange={(e) => series.actualizar(s.id, {
                      peso: e.target.value === "" ? null : Number(e.target.value),
                    })} />
                  <span className="serie-x">×</span>
                  <input type="number" value={s.repeticiones ?? ""} placeholder="reps"
                    onChange={(e) => series.actualizar(s.id, {
                      repeticiones: e.target.value === "" ? null : Number(e.target.value),
                    })} />
                  <button className="item-borrar" onClick={() => series.borrar(s.id)}
                    aria-label="Borrar serie">×</button>
                </li>
              ))}
            </ul>

            <button className="btn btn-chico"
              onClick={() => {
                const ultima = g.series[g.series.length - 1];
                agregarSerie(g.ejercicio_id, {
                  peso: ultima?.peso ?? null,
                  repeticiones: ultima?.repeticiones ?? null,
                });
              }}>
              + Serie
            </button>
          </section>
        );
      })}

      <button className="btn btn-primario" onClick={() => setAgregando(true)}>+ Ejercicio</button>

      <button className="btn btn-peligro btn-borrar-sesion"
        onClick={async () => {
          if (await confirmar("Se borra la sesión con todas sus series.")) {
            await sesiones.borrar(sesion.id);
            alCerrar();
          }
        }}>
        Borrar sesión
      </button>

      {agregando && (
        <ModalElegirEjercicio
          ejercicios={ejercicios}
          yaEn={grupos.map((g) => g.ejercicio_id)}
          alCerrar={() => setAgregando(false)}
          alElegir={async (id) => {
            const previa = ultimaVez(id, series.filas, sesiones.filas, sesion.id);
            const base = previa?.series?.[0];
            await agregarSerie(id, {
              peso: base?.peso ?? null,
              repeticiones: base?.repeticiones ?? null,
            });
            setAgregando(false);
          }}
        />
      )}
    </div>
  );
}

function ModalElegirEjercicio({ ejercicios, yaEn, alElegir, alCerrar }) {
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const filtrados = ejercicios.filas.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  async function crearYElegir(e) {
    e.preventDefault();
    const nombre = busqueda.trim();
    if (!nombre) return;
    setCreando(true);
    const nuevo = await ejercicios.crear({ nombre });
    setCreando(false);
    alElegir(nuevo.id);
  }

  return (
    <Modal titulo="Agregar ejercicio" alCerrar={alCerrar} ancho={420}>
      <form onSubmit={crearYElegir}>
        <Campo etiqueta="Buscar o escribir uno nuevo">
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Press banca, sentadilla..." autoFocus />
        </Campo>
      </form>

      <ul className="lista lista-simple">
        {filtrados.map((e) => (
          <li key={e.id} className="item">
            <button className="item-cuerpo" onClick={() => alElegir(e.id)}>
              <span className="item-titulo">{e.nombre}</span>
              {e.grupo && <span className="item-meta">{e.grupo}</span>}
            </button>
            {yaEn.includes(e.id) && <span className="item-fecha">ya está</span>}
          </li>
        ))}
        {busqueda.trim() && !filtrados.some(
          (e) => e.nombre.toLowerCase() === busqueda.trim().toLowerCase()
        ) && (
          <li className="item">
            <button className="item-cuerpo" onClick={crearYElegir} disabled={creando}>
              <span className="item-titulo">Crear "{busqueda.trim()}"</span>
            </button>
          </li>
        )}
        {!ejercicios.filas.length && !busqueda && (
          <li className="lista-nota">Escribí el nombre del ejercicio para crearlo.</li>
        )}
      </ul>
    </Modal>
  );
}

function ModalEjercicios({ ejercicios, alCerrar }) {
  const [nombre, setNombre] = useState("");
  const [grupo, setGrupo] = useState("");
  const { confirmar, dialogo } = useConfirmar();

  return (
    <Modal titulo="Mis ejercicios" alCerrar={alCerrar}>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        ejercicios.crear({ nombre: nombre.trim(), grupo: grupo || null });
        setNombre("");
      }}>
        <Fila>
          <Campo etiqueta="Nombre" ancho={200}>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Campo>
          <Campo etiqueta="Grupo" ancho={140}>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
              <option value="">—</option>
              {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Campo>
        </Fila>
        <button className="btn btn-primario" disabled={!nombre.trim()}>Agregar</button>
      </form>

      <ul className="lista lista-simple">
        {ejercicios.filas.map((e) => (
          <li key={e.id} className="item">
            <span className="item-titulo">{e.nombre}</span>
            {e.grupo && <span className="item-meta">{e.grupo}</span>}
            <button className="item-borrar"
              onClick={async () => {
                if (await confirmar(
                  `Se borra "${e.nombre}" y las series registradas con ese ejercicio.`
                )) ejercicios.borrar(e.id);
              }}
              aria-label="Borrar">×</button>
          </li>
        ))}
        {!ejercicios.filas.length && <li className="lista-nota">Todavía no cargaste ninguno.</li>}
      </ul>

      {dialogo}
    </Modal>
  );
}
