import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import {
  ejerciciosBaseStore, planesStore, planDiasStore, planEjerciciosStore,
  ejerciciosStore, descansoTexto, guardarPlan, sesionDesdeDia,
} from "./datos.js";
import { DEPORTES, NIVELES, EQUIPOS, deportePorId } from "./deportes.js";
import { generarPlan } from "./generador.js";
import { hoyISO } from "../../core/fecha.js";
import { Cargando, ErrorCaja, Modal, Vacio, useConfirmar } from "../../core/ui/index.jsx";

export function Plan({ alAbrirSesion }) {
  const planes = useTabla(planesStore, { filtros: { activo: true }, limite: 1 });
  const plan = planes.filas[0] || null;

  const dias = useTabla(planDiasStore, {
    filtros: { plan_id: plan?.id },
    activo: !!plan,
  });
  const idsDia = useMemo(() => dias.filas.map((d) => d.id), [dias.filas]);
  const ejercicios = useTabla(planEjerciciosStore, {
    filtros: { plan_dia_id: idsDia },
    activo: idsDia.length > 0,
  });

  const propios = useTabla(ejerciciosStore);
  const { confirmar, dialogo } = useConfirmar();
  const [generando, setGenerando] = useState(false);
  const [verNotas, setVerNotas] = useState(false);
  const [creandoSesion, setCreandoSesion] = useState(null);

  async function empezar(dia) {
    setCreandoSesion(dia.id);
    try {
      const delDia = ejercicios.filas
        .filter((e) => e.plan_dia_id === dia.id)
        .sort((a, b) => a.orden - b.orden);
      const sesion = await sesionDesdeDia(dia, delDia, propios.filas, hoyISO());
      alAbrirSesion?.(sesion.id);
    } finally {
      setCreandoSesion(null);
    }
  }

  if (planes.cargando) return <Cargando />;

  if (!plan) {
    return (
      <>
        <Vacio
          icono="⟡"
          titulo="Todavía no tenés una rutina"
          texto="Decime qué deporte hacés, cuántos días podés entrenar y con qué equipamiento, y te armo el plan."
          accion={
            <button className="btn btn-primario" onClick={() => setGenerando(true)}>
              Generar mi rutina
            </button>
          }
        />
        {generando && <Asistente alCerrar={() => setGenerando(false)} alGuardar={planes.recargar} />}
      </>
    );
  }

  const deporte = deportePorId(plan.deporte);

  return (
    <div className="plan">
      <ErrorCaja error={planes.error || dias.error} alReintentar={planes.recargar} />

      <header className="plan-cab">
        <div>
          <h2>{plan.nombre}</h2>
          <p className="plan-sub">
            {NIVELES.find((n) => n.id === plan.nivel)?.nombre} ·
            {" "}{objetivoTexto(plan.objetivo)} ·
            {" "}{plan.dias_semana} {plan.dias_semana === 1 ? "día" : "días"} por semana
          </p>
        </div>
        <div className="plan-acciones">
          <button className="btn btn-chico" onClick={() => setVerNotas(true)}>Cómo usarlo</button>
          <button className="btn btn-chico" onClick={() => setGenerando(true)}>Rehacer</button>
        </div>
      </header>

      {dias.cargando && !dias.filas.length ? (
        <Cargando />
      ) : (
        <div className="plan-dias">
          {dias.filas.map((dia) => {
            const delDia = ejercicios.filas
              .filter((e) => e.plan_dia_id === dia.id)
              .sort((a, b) => a.orden - b.orden);

            return (
              <section key={dia.id} className="plan-dia">
                <header className="plan-dia-cab">
                  <div>
                    <h3>{dia.nombre}</h3>
                    <span className="plan-dia-foco">{dia.foco}</span>
                  </div>
                  <button className="btn btn-chico btn-primario"
                    onClick={() => empezar(dia)}
                    disabled={creandoSesion === dia.id || !delDia.length}>
                    {creandoSesion === dia.id ? "Creando..." : "Entrenar"}
                  </button>
                </header>

                <ul className="plan-ejercicios">
                  {delDia.map((e) => (
                    <li key={e.id} className={"plan-ej plan-ej-" + (e.rol || "")}>
                      <div className="plan-ej-fila">
                        <span className="plan-ej-nombre">{e.nombre}</span>
                        <span className="plan-ej-dosis">
                          {e.series}×{e.reps_min === e.reps_max ? e.reps_min : `${e.reps_min}-${e.reps_max}`}
                        </span>
                      </div>
                      <div className="plan-ej-meta">
                        <span>descanso {descansoTexto(e.descanso_seg)}</span>
                        {e.nota && <span className="plan-ej-nota">{e.nota}</span>}
                      </div>
                    </li>
                  ))}
                  {!delDia.length && <li className="lista-nota">Sin ejercicios.</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {verNotas && (
        <Modal titulo="Cómo usar este plan" alCerrar={() => setVerNotas(false)} ancho={520}>
          <p className="plan-deporte">{deporte.nombre}</p>
          {(plan.notas || "").split("\n\n").map((p, i) => (
            <p key={i} className="plan-nota">{p}</p>
          ))}
        </Modal>
      )}

      {generando && (
        <Asistente
          alCerrar={() => setGenerando(false)}
          alGuardar={async () => {
            // El plan viejo se archiva, no se borra: las sesiones que salieron
            // de él siguen teniendo sentido en el historial.
            await planesStore.actualizar(plan.id, { activo: false });
            planes.recargar();
          }}
          inicial={plan}
        />
      )}

      {dialogo}
    </div>
  );
}

function objetivoTexto(id) {
  return {
    fuerza: "Fuerza máxima",
    hipertrofia: "Masa muscular",
    potencia: "Potencia",
    resistencia: "Resistencia",
  }[id] ?? id;
}

/* --- Asistente ------------------------------------------------------------ */

function Asistente({ alCerrar, alGuardar, inicial }) {
  const catalogo = useTabla(ejerciciosBaseStore);
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const [f, setF] = useState({
    deporte: inicial?.deporte || "general",
    nivel: inicial?.nivel || "principiante",
    dias: inicial?.dias_semana || 3,
    equipo: "gimnasio",
  });
  const elegir = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const vistaPrevia = useMemo(
    () => (paso === 4 && catalogo.filas.length ? generarPlan(f, catalogo.filas) : null),
    [paso, f, catalogo.filas]
  );

  async function confirmar() {
    setGuardando(true);
    setError(null);
    try {
      await guardarPlan(vistaPrevia);
      await alGuardar?.();
      alCerrar();
    } catch (e) {
      setError(e);
      setGuardando(false);
    }
  }

  const pasos = ["Deporte", "Nivel", "Días", "Equipo", "Tu plan"];

  return (
    <Modal titulo={pasos[paso]} ancho={620} alCerrar={alCerrar}
      pie={
        <>
          {paso > 0 && (
            <button className="btn" onClick={() => setPaso(paso - 1)} disabled={guardando}>
              Volver
            </button>
          )}
          {paso < 4 ? (
            <button className="btn btn-primario" onClick={() => setPaso(paso + 1)}>
              Seguir
            </button>
          ) : (
            <button className="btn btn-primario" onClick={confirmar}
              disabled={guardando || !vistaPrevia}>
              {guardando ? "Guardando..." : "Guardar plan"}
            </button>
          )}
        </>
      }>
      <div className="pasos">
        {pasos.map((p, i) => (
          <span key={p} className={"paso" + (i === paso ? " paso-activo" : "") + (i < paso ? " paso-hecho" : "")} />
        ))}
      </div>

      <ErrorCaja error={error} />

      {paso === 0 && (
        <>
          <p className="seccion-ayuda">
            Define las prioridades del plan y el trabajo preventivo. Si no hacés
            ningún deporte en particular, elegí Salud general.
          </p>
          <div className="opciones opciones-densas">
            {DEPORTES.map((d) => (
              <button key={d.id} type="button"
                className={"opcion" + (f.deporte === d.id ? " opcion-activa" : "")}
                onClick={() => elegir("deporte", d.id)}>
                <strong>{d.nombre}</strong>
              </button>
            ))}
          </div>
          <p className="plan-nota plan-nota-suave">{deportePorId(f.deporte).nota}</p>
        </>
      )}

      {paso === 1 && (
        <div className="opciones">
          {NIVELES.map((n) => (
            <button key={n.id} type="button"
              className={"opcion" + (f.nivel === n.id ? " opcion-activa" : "")}
              onClick={() => elegir("nivel", n.id)}>
              <strong>{n.nombre}</strong>
              <small>{n.detalle}</small>
            </button>
          ))}
        </div>
      )}

      {paso === 2 && (
        <>
          <p className="seccion-ayuda">
            Cuántos días por semana podés ir al gimnasio. Es mejor cumplir tres
            que planear seis y hacer dos.
          </p>
          <div className="dias-selector dias-grandes">
            {[2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button"
                className={"dia" + (f.dias === d ? " dia-on" : "")}
                onClick={() => elegir("dias", d)}>{d}</button>
            ))}
          </div>
        </>
      )}

      {paso === 3 && (
        <div className="opciones">
          {EQUIPOS.map((e) => (
            <button key={e.id} type="button"
              className={"opcion" + (f.equipo === e.id ? " opcion-activa" : "")}
              onClick={() => elegir("equipo", e.id)}>
              <strong>{e.nombre}</strong>
              <small>{e.detalle}</small>
            </button>
          ))}
        </div>
      )}

      {paso === 4 && (
        catalogo.cargando ? (
          <Cargando texto="Armando el plan..." />
        ) : !vistaPrevia ? (
          <p className="pista">No se pudo armar el plan. Probá con otro equipamiento.</p>
        ) : (
          <>
            <p className="plan-titulo-previa">{vistaPrevia.nombre}</p>
            <div className="previa-dias">
              {vistaPrevia.dias.map((d, i) => (
                <div key={i} className="previa-dia">
                  <h4>{d.nombre}</h4>
                  <ul>
                    {d.ejercicios.map((e, j) => (
                      <li key={j}>
                        <span>{e.nombre}</span>
                        <b>{e.series}×{e.reps_min}-{e.reps_max}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="plan-nota plan-nota-suave">
              Lo podés editar después. Los pesos los cargás al entrenar.
            </p>
          </>
        )
      )}
    </Modal>
  );
}
