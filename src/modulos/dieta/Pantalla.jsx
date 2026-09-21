import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import { usePerfil } from "../../core/perfil.jsx";
import { perfilCompleto } from "../../core/salud.js";
import {
  alimentosStore, alimentosBaseStore, comidasStore, itemsStore,
  MOMENTOS, MACROS, macrosDe, sumar, buscarAlimentos,
} from "./datos.js";
import { objetivosDiarios, reparto } from "./calculadora.js";
import { generarDia, desvio } from "./generador.js";
import { hoyISO, sumarDias, fechaRelativa } from "../../core/fecha.js";
import { numero } from "../../core/formato.js";
import { ir } from "../../app/rutas.js";
import {
  Cabecera, Campo, Cargando, ErrorCaja, Fila, Modal, Progreso, Vacio, useConfirmar,
} from "../../core/ui/index.jsx";

export function Pantalla() {
  const [fecha, setFecha] = useState(hoyISO);
  const { perfil, guardar } = usePerfil();
  const { confirmar, dialogo } = useConfirmar();

  const comidas = useTabla(comidasStore, { filtros: { fecha } });
  const idsComida = useMemo(() => comidas.filas.map((c) => c.id), [comidas.filas]);
  const items = useTabla(itemsStore, {
    filtros: { comida_id: idsComida },
    activo: idsComida.length > 0,
  });
  const alimentos = useTabla(alimentosStore);
  const base = useTabla(alimentosBaseStore);

  const [agregandoEn, setAgregandoEn] = useState(null);
  const [verAlimentos, setVerAlimentos] = useState(false);
  const [verObjetivos, setVerObjetivos] = useState(false);
  const [generando, setGenerando] = useState(false);

  const total = useMemo(() => sumar(items.filas), [items.filas]);
  const calculados = useMemo(() => objetivosDiarios(perfil, hoyISO()), [perfil]);

  async function comidaDe(momento) {
    const existente = comidas.filas.find((c) => c.momento === momento);
    if (existente) return existente;
    return comidas.crear({ fecha, momento });
  }

  async function agregarItem(momento, alimento, gramos) {
    const comida = await comidaDe(momento);
    await items.crear({
      comida_id: comida.id,
      // Solo se guarda el vínculo si el alimento es propio: alimento_id apunta
      // a public.alimentos, y los del catálogo general viven en otra tabla.
      alimento_id: alimento.propio ? alimento.id : null,
      nombre: alimento.nombre,
      gramos: Number(gramos),
      ...macrosDe(alimento, gramos),
    });
  }

  /** Vuelca un plan generado al día: crea las comidas y sus items. */
  async function cargarPlan(plan) {
    for (const c of plan.comidas) {
      const comida = await comidaDe(c.momento);
      await itemsStore.crearVarias(
        c.items.map((i) => ({
          comida_id: comida.id,
          alimento_id: null,
          nombre: i.nombre,
          gramos: i.gramos,
          kcal: i.kcal,
          prot: i.prot,
          carb: i.carb,
          gras: i.gras,
        }))
      );
    }
    await comidas.recargar();
    await items.recargar();
  }

  if (comidas.cargando && !comidas.filas.length) return <Cargando />;

  const hayAlgoCargado = items.filas.length > 0;

  return (
    <div className="pantalla">
      <Cabecera titulo="Dieta" subtitulo={fechaRelativa(fecha)}>
        <button className="btn" onClick={() => setVerAlimentos(true)}>Alimentos</button>
        <button className="btn" onClick={() => setVerObjetivos(true)}>Objetivos</button>
        <button className="btn btn-primario" onClick={() => setGenerando(true)}>
          Generar el día
        </button>
      </Cabecera>

      <ErrorCaja error={comidas.error || items.error} alReintentar={comidas.recargar} />

      <div className="fecha-nav">
        <button className="btn btn-chico" onClick={() => setFecha(sumarDias(fecha, -1))}>‹</button>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value || hoyISO())} />
        <button className="btn btn-chico" onClick={() => setFecha(sumarDias(fecha, 1))}>›</button>
        {fecha !== hoyISO() && (
          <button className="btn btn-chico" onClick={() => setFecha(hoyISO())}>Hoy</button>
        )}
      </div>

      <div className="macros">
        {MACROS.map((m) => {
          const objetivo = Number(perfil?.[m.objetivo]) || Number(calculados?.[m.id]) || 0;
          const valor = total[m.id];
          return (
            <div key={m.id} className="macro">
              <div className="macro-cab">
                <span>{m.nombre}</span>
                <b>
                  {numero(valor, m.id === "kcal" ? 0 : 1)}
                  {objetivo > 0 && <small> / {numero(objetivo)}</small>} {m.unidad}
                </b>
              </div>
              {objetivo > 0 ? (
                <Progreso valor={valor} maximo={objetivo} color={m.color} />
              ) : (
                <small className="macro-sin-meta">sin objetivo</small>
              )}
            </div>
          );
        })}
      </div>

      {!perfilCompleto(perfil) && (
        <div className="aviso">
          Completá tu peso, altura, sexo y fecha de nacimiento en Ajustes y
          calculo tus calorías solo.{" "}
          <button className="enlace" onClick={() => ir("ajustes")}>Ir a Ajustes</button>
        </div>
      )}

      {MOMENTOS.map((m) => {
        const comida = comidas.filas.find((c) => c.momento === m.id);
        const suyos = comida ? items.filas.filter((i) => i.comida_id === comida.id) : [];
        const t = sumar(suyos);

        return (
          <section key={m.id} className="comida">
            <header className="comida-cab">
              <h2>{m.nombre}</h2>
              {suyos.length > 0 && <span className="comida-kcal">{numero(t.kcal)} kcal</span>}
              <button className="btn btn-chico" onClick={() => setAgregandoEn(m.id)}>+</button>
            </header>

            {suyos.length === 0 ? (
              <p className="comida-vacia">—</p>
            ) : (
              <ul className="lista lista-simple">
                {suyos.map((i) => (
                  <li key={i.id} className="item">
                    <span className="item-titulo">{i.nombre}</span>
                    <span className="item-meta">
                      {numero(i.gramos)} g · {numero(i.kcal)} kcal ·
                      {" "}P {numero(i.prot, 1)} · C {numero(i.carb, 1)} · G {numero(i.gras, 1)}
                    </span>
                    <button className="item-borrar" onClick={() => items.borrar(i.id)}
                      aria-label="Quitar">×</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {agregandoEn && (
        <ModalAgregar
          momento={MOMENTOS.find((m) => m.id === agregandoEn)}
          alimentos={alimentos}
          base={base.filas}
          alCerrar={() => setAgregandoEn(null)}
          alAgregar={async (alimento, gramos) => {
            await agregarItem(agregandoEn, alimento, gramos);
            setAgregandoEn(null);
          }}
        />
      )}

      {verAlimentos && (
        <ModalAlimentos alimentos={alimentos} base={base.filas} confirmar={confirmar}
          alCerrar={() => setVerAlimentos(false)} />
      )}

      {verObjetivos && (
        <ModalObjetivos perfil={perfil} calculados={calculados} guardar={guardar}
          alCerrar={() => setVerObjetivos(false)} />
      )}

      {generando && (
        <ModalGenerar
          objetivos={calculados}
          perfil={perfil}
          base={base}
          hayAlgoCargado={hayAlgoCargado}
          confirmar={confirmar}
          alCerrar={() => setGenerando(false)}
          alCargar={async (plan) => {
            await cargarPlan(plan);
            setGenerando(false);
          }}
        />
      )}

      {dialogo}
    </div>
  );
}

/* --- Generador ------------------------------------------------------------ */

function ModalGenerar({ objetivos, perfil, base, hayAlgoCargado, confirmar, alCerrar, alCargar }) {
  const [cantidad, setCantidad] = useState(4);
  const [cargando, setCargando] = useState(false);

  const plan = useMemo(
    () => (objetivos && base.filas.length ? generarDia(objetivos, base.filas, cantidad) : null),
    [objetivos, base.filas, cantidad]
  );
  const d = plan ? desvio(plan.total, objetivos) : null;

  if (!perfilCompleto(perfil)) {
    return (
      <Modal titulo="Generar el día" ancho={440} alCerrar={alCerrar}>
        <Vacio
          icono="◑"
          titulo="Faltan tus datos"
          texto="Para calcular cuántas calorías necesitás hacen falta tu peso, tu altura, tu sexo y tu fecha de nacimiento."
          accion={<button className="btn btn-primario" onClick={() => ir("ajustes")}>Ir a Ajustes</button>}
        />
      </Modal>
    );
  }

  async function cargar() {
    if (hayAlgoCargado) {
      const ok = await confirmar(
        "Ya tenés comidas cargadas en este día. El plan se suma a lo que ya hay, no lo reemplaza.",
        { titulo: "Cargar igual", boton: "Cargar" }
      );
      if (!ok) return;
    }
    setCargando(true);
    try {
      await alCargar(plan);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal titulo="Generar el día" ancho={620} alCerrar={alCerrar}
      pie={
        <>
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario" onClick={cargar} disabled={!plan || cargando}>
            {cargando ? "Cargando..." : "Cargar al día"}
          </button>
        </>
      }>
      <p className="seccion-ayuda">
        Un día armado para llegar a tus objetivos. Es un punto de partida: cargalo
        y después cambiá lo que quieras.
      </p>

      <Campo etiqueta="Cuántas comidas por día">
        <div className="dias-selector dias-grandes">
          {[3, 4, 5].map((n) => (
            <button key={n} type="button"
              className={"dia" + (cantidad === n ? " dia-on" : "")}
              onClick={() => setCantidad(n)}>{n}</button>
          ))}
        </div>
      </Campo>

      {base.cargando ? (
        <Cargando texto="Buscando alimentos..." />
      ) : !plan ? (
        <p className="pista">No se pudo armar el plan.</p>
      ) : (
        <>
          <div className="previa-dias">
            {plan.comidas.map((c) => (
              <div key={c.momento} className="previa-dia">
                <h4>
                  {MOMENTOS.find((m) => m.id === c.momento)?.nombre}
                  <span className="previa-kcal">{numero(c.total.kcal)} kcal</span>
                </h4>
                <ul>
                  {c.items.map((i, j) => (
                    <li key={j}>
                      <span>{i.nombre}</span>
                      <b>{numero(i.gramos)} g</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="previa-total">
            <strong>
              {numero(plan.total.kcal)} kcal · P {numero(plan.total.prot)} ·
              {" "}C {numero(plan.total.carb)} · G {numero(plan.total.gras)}
            </strong>
            <span className={Math.abs(d.kcal) <= 5 ? "desvio-ok" : "desvio-alto"}>
              {d.kcal === 0 ? "justo en el objetivo" : `${d.kcal > 0 ? "+" : ""}${d.kcal}% sobre el objetivo`}
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}

/* --- Objetivos ------------------------------------------------------------ */

function ModalObjetivos({ perfil, calculados, guardar, alCerrar }) {
  const [f, setF] = useState({
    kcal_objetivo: perfil?.kcal_objetivo ?? "",
    prot_objetivo: perfil?.prot_objetivo ?? "",
    carb_objetivo: perfil?.carb_objetivo ?? "",
    gras_objetivo: perfil?.gras_objetivo ?? "",
  });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const usarCalculados = () =>
    setF({
      kcal_objetivo: calculados.kcal,
      prot_objetivo: calculados.prot,
      carb_objetivo: calculados.carb,
      gras_objetivo: calculados.gras,
    });

  const r = calculados ? reparto(calculados) : null;

  return (
    <Modal titulo="Objetivos diarios" ancho={460} alCerrar={alCerrar}
      pie={
        <>
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario"
            onClick={async () => {
              await guardar(
                Object.fromEntries(
                  Object.entries(f).map(([k, v]) => [k, v === "" ? null : Number(v)])
                )
              );
              alCerrar();
            }}>
            Guardar
          </button>
        </>
      }>
      {calculados ? (
        <section className="calculo-caja">
          <h3>Según tus datos</h3>
          <ul className="calculo-lista">
            <li><span>En reposo gastás</span><b>{numero(calculados.reposo)} kcal</b></li>
            <li><span>Con tu actividad</span><b>{numero(calculados.total)} kcal</b></li>
            <li className="calculo-destacado">
              <span>Para tu objetivo</span><b>{numero(calculados.kcal)} kcal</b>
            </li>
          </ul>
          <p className="calculo-macros">
            P {calculados.prot} g ({r.prot}%) · C {calculados.carb} g ({r.carb}%) ·
            {" "}G {calculados.gras} g ({r.gras}%)
          </p>
          <button className="btn btn-chico" onClick={usarCalculados}>Usar estos valores</button>
          <p className="campo-ayuda">
            Es una estimación. El número real se ajusta mirando cómo se mueve tu
            peso en dos o tres semanas, no recalculando la fórmula.
          </p>
        </section>
      ) : (
        <p className="campo-ayuda">
          Cargá tus datos en Ajustes y calculo estos números solo.
        </p>
      )}

      <p className="campo-ayuda">Podés escribirlos a mano. En blanco, no se sigue ese macro.</p>
      <Fila>
        <Campo etiqueta="Calorías" ancho={120}>
          <input type="number" value={f.kcal_objetivo}
            onChange={(e) => cambiar("kcal_objetivo", e.target.value)} />
        </Campo>
        <Campo etiqueta="Proteína (g)" ancho={120}>
          <input type="number" value={f.prot_objetivo}
            onChange={(e) => cambiar("prot_objetivo", e.target.value)} />
        </Campo>
        <Campo etiqueta="Carbos (g)" ancho={120}>
          <input type="number" value={f.carb_objetivo}
            onChange={(e) => cambiar("carb_objetivo", e.target.value)} />
        </Campo>
        <Campo etiqueta="Grasas (g)" ancho={120}>
          <input type="number" value={f.gras_objetivo}
            onChange={(e) => cambiar("gras_objetivo", e.target.value)} />
        </Campo>
      </Fila>
    </Modal>
  );
}

/* --- Agregar un alimento -------------------------------------------------- */

function ModalAgregar({ momento, alimentos, base, alAgregar, alCerrar }) {
  const [busqueda, setBusqueda] = useState("");
  const [elegido, setElegido] = useState(null);
  const [gramos, setGramos] = useState(100);
  const [nuevo, setNuevo] = useState(false);

  const resultados = useMemo(
    () => buscarAlimentos(busqueda, alimentos.filas, base),
    [busqueda, alimentos.filas, base]
  );

  if (nuevo) {
    return (
      <FormAlimento
        inicial={{ nombre: busqueda.trim() }}
        titulo="Nuevo alimento"
        alCerrar={() => setNuevo(false)}
        alGuardar={async (datos) => {
          const a = await alimentos.crear(datos);
          setNuevo(false);
          setElegido({ ...a, propio: true });
          setGramos(a.porcion_g || 100);
        }}
      />
    );
  }

  if (elegido) {
    const m = macrosDe(elegido, gramos);
    return (
      <Modal titulo={elegido.nombre} ancho={380} alCerrar={() => setElegido(null)}
        pie={
          <>
            <button className="btn" onClick={() => setElegido(null)}>Volver</button>
            <button className="btn btn-primario" disabled={!gramos}
              onClick={() => alAgregar(elegido, gramos)}>
              Agregar a {momento.nombre.toLowerCase()}
            </button>
          </>
        }>
        <Campo etiqueta="Cantidad (gramos)">
          <input type="number" min={1} value={gramos} autoFocus
            onChange={(e) => setGramos(e.target.value)} />
        </Campo>
        {elegido.porcion_g && (
          <button className="btn btn-chico" onClick={() => setGramos(elegido.porcion_g)}>
            {elegido.porcion_nombre
              ? `${elegido.porcion_nombre} (${elegido.porcion_g} g)`
              : `Porción habitual (${elegido.porcion_g} g)`}
          </button>
        )}
        <p className="calculo">
          {m.kcal} kcal · P {m.prot} · C {m.carb} · G {m.gras}
        </p>
      </Modal>
    );
  }

  return (
    <Modal titulo={`Agregar a ${momento.nombre.toLowerCase()}`} ancho={440} alCerrar={alCerrar}>
      <Campo etiqueta="Buscar alimento" ayuda={`${base.length} alimentos en el catálogo`}>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Pollo, arroz, yogur..." autoFocus />
      </Campo>

      <ul className="lista lista-simple lista-scroll">
        {resultados.slice(0, 60).map((a) => (
          <li key={(a.propio ? "p" : "b") + a.id} className="item">
            <button className="item-cuerpo"
              onClick={() => { setElegido(a); setGramos(a.porcion_g || 100); }}>
              <span className="item-titulo">
                {a.nombre}
                {a.propio && <span className="etiqueta etiqueta-propio">tuyo</span>}
              </span>
              <span className="item-meta">
                {numero(a.kcal_100)} kcal · P {numero(a.prot_100, 1)} ·
                {" "}C {numero(a.carb_100, 1)} · G {numero(a.gras_100, 1)} por 100 g
              </span>
            </button>
          </li>
        ))}
        {busqueda.trim() && (
          <li className="item">
            <button className="item-cuerpo" onClick={() => setNuevo(true)}>
              <span className="item-titulo">Crear "{busqueda.trim()}"</span>
              <span className="item-meta">Si no está en el catálogo</span>
            </button>
          </li>
        )}
      </ul>
    </Modal>
  );
}

function FormAlimento({ inicial, titulo, alGuardar, alCerrar }) {
  const [f, setF] = useState({
    nombre: inicial?.nombre || "",
    kcal_100: inicial?.kcal_100 ?? "",
    prot_100: inicial?.prot_100 ?? "",
    carb_100: inicial?.carb_100 ?? "",
    gras_100: inicial?.gras_100 ?? "",
    porcion_g: inicial?.porcion_g ?? "",
  });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const n = (v) => (v === "" ? 0 : Number(v));

  return (
    <Modal titulo={titulo} ancho={440} alCerrar={alCerrar}
      pie={
        <>
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={!f.nombre.trim()}
            onClick={() => alGuardar({
              nombre: f.nombre.trim(),
              kcal_100: n(f.kcal_100),
              prot_100: n(f.prot_100),
              carb_100: n(f.carb_100),
              gras_100: n(f.gras_100),
              porcion_g: f.porcion_g === "" ? null : Number(f.porcion_g),
            })}>
            Guardar
          </button>
        </>
      }>
      <Campo etiqueta="Nombre">
        <input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)} autoFocus />
      </Campo>

      <p className="campo-ayuda">Valores por cada 100 g, como vienen en la etiqueta.</p>

      <Fila>
        <Campo etiqueta="Calorías" ancho={100}>
          <input type="number" value={f.kcal_100} onChange={(e) => cambiar("kcal_100", e.target.value)} />
        </Campo>
        <Campo etiqueta="Proteína" ancho={100}>
          <input type="number" step="0.1" value={f.prot_100} onChange={(e) => cambiar("prot_100", e.target.value)} />
        </Campo>
        <Campo etiqueta="Carbos" ancho={100}>
          <input type="number" step="0.1" value={f.carb_100} onChange={(e) => cambiar("carb_100", e.target.value)} />
        </Campo>
        <Campo etiqueta="Grasas" ancho={100}>
          <input type="number" step="0.1" value={f.gras_100} onChange={(e) => cambiar("gras_100", e.target.value)} />
        </Campo>
      </Fila>

      <Campo etiqueta="Porción habitual (g)" ayuda="opcional, para cargar rápido">
        <input type="number" value={f.porcion_g} onChange={(e) => cambiar("porcion_g", e.target.value)} />
      </Campo>
    </Modal>
  );
}

function ModalAlimentos({ alimentos, base, confirmar, alCerrar }) {
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const resultados = useMemo(
    () => buscarAlimentos(busqueda, alimentos.filas, base),
    [busqueda, alimentos.filas, base]
  );

  if (editando) {
    return (
      <FormAlimento
        inicial={editando.id ? editando : null}
        titulo={editando.id ? "Editar alimento" : "Nuevo alimento"}
        alCerrar={() => setEditando(null)}
        alGuardar={async (datos) => {
          if (editando.id) await alimentos.actualizar(editando.id, datos);
          else await alimentos.crear(datos);
          setEditando(null);
        }}
      />
    );
  }

  return (
    <Modal titulo="Alimentos" alCerrar={alCerrar}>
      <p className="campo-ayuda">
        El catálogo general lo comparten todos y no se edita. Los tuyos sí:
        creá uno cuando tengas la etiqueta de un producto puntual.
      </p>

      <Fila>
        <Campo etiqueta="Buscar" ancho={240}>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </Campo>
        <button className="btn btn-primario" onClick={() => setEditando({})}>Nuevo</button>
      </Fila>

      <ul className="lista lista-simple lista-scroll">
        {resultados.slice(0, 80).map((a) => (
          <li key={(a.propio ? "p" : "b") + a.id} className="item">
            <button className="item-cuerpo"
              onClick={() => a.propio && setEditando(a)}
              disabled={!a.propio}>
              <span className="item-titulo">
                {a.nombre}
                {a.propio && <span className="etiqueta etiqueta-propio">tuyo</span>}
              </span>
              <span className="item-meta">
                {numero(a.kcal_100)} kcal · P {numero(a.prot_100, 1)} ·
                {" "}C {numero(a.carb_100, 1)} · G {numero(a.gras_100, 1)} (100 g)
              </span>
            </button>
            {a.propio && (
              <button className="item-borrar"
                onClick={async () => {
                  if (await confirmar(
                    `Se borra "${a.nombre}" de tus alimentos. Lo que ya comiste queda registrado igual.`
                  )) alimentos.borrar(a.id);
                }}
                aria-label="Borrar">×</button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
