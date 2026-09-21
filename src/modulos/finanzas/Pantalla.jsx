import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import {
  movimientosStore, categoriasStore, vencimientosStore, MEDIOS,
  primerDiaDe, ultimoDiaDe, mesAnterior, mesSiguiente, rotuloMes,
  totales, porCategoria, porVencer, estaPagado,
} from "./datos.js";
import { hoyISO, mesDe, fechaRelativa } from "../../core/fecha.js";
import { plata } from "../../core/formato.js";
import {
  Cabecera, Campo, Cargando, Dato, ErrorCaja, Fila, Modal,
  Progreso, SelectorColor, Vacio, useConfirmar,
} from "../../core/ui/index.jsx";

export function Pantalla() {
  const [mes, setMes] = useState(() => mesDe(hoyISO()));
  const { confirmar, dialogo } = useConfirmar();

  const movimientos = useTabla(movimientosStore, {
    filtros: {
      fecha: { op: "gte", valor: primerDiaDe(mes) },
    },
  });
  const categorias = useTabla(categoriasStore);
  const vencimientos = useTabla(vencimientosStore);

  const [verCategorias, setVerCategorias] = useState(false);
  const [verVencimientos, setVerVencimientos] = useState(false);
  const [editando, setEditando] = useState(null);

  // El filtro de la consulta solo acota por abajo (gte): el corte de arriba se
  // hace acá, así navegar entre meses no dispara una consulta nueva por cada uno.
  const delMes = useMemo(
    () => movimientos.filas.filter((m) => m.fecha >= primerDiaDe(mes) && m.fecha <= ultimoDiaDe(mes)),
    [movimientos.filas, mes]
  );

  const t = useMemo(() => totales(delMes), [delMes]);
  const gastos = useMemo(() => porCategoria(delMes, categorias.filas), [delMes, categorias.filas]);
  const pendientes = useMemo(() => porVencer(vencimientos.filas, mes), [vencimientos.filas, mes]);
  const nombreCat = useMemo(
    () => Object.fromEntries(categorias.filas.map((c) => [c.id, c])),
    [categorias.filas]
  );

  if (movimientos.cargando && !movimientos.filas.length) return <Cargando />;

  return (
    <div className="pantalla">
      <Cabecera titulo="Finanzas" subtitulo={rotuloMes(mes)}>
        <button className="btn" onClick={() => setVerCategorias(true)}>Categorías</button>
        <button className="btn" onClick={() => setVerVencimientos(true)}>Vencimientos</button>
      </Cabecera>

      <ErrorCaja error={movimientos.error} alReintentar={movimientos.recargar} />

      <div className="fecha-nav">
        <button className="btn btn-chico" onClick={() => setMes(mesAnterior(mes))}>‹</button>
        <span className="mes-rotulo">{rotuloMes(mes)}</span>
        <button className="btn btn-chico" onClick={() => setMes(mesSiguiente(mes))}
          disabled={mes >= mesDe(hoyISO())}>›</button>
        {mes !== mesDe(hoyISO()) && (
          <button className="btn btn-chico" onClick={() => setMes(mesDe(hoyISO()))}>Este mes</button>
        )}
      </div>

      <div className="datos">
        <Dato titulo="Ingresos" valor={plata(t.ingresos)} tono="bien" />
        <Dato titulo="Egresos" valor={plata(t.egresos)} tono="mal" />
        <Dato titulo="Balance" valor={plata(t.balance)}
          tono={t.balance >= 0 ? "bien" : "mal"}
          detalle={t.ingresos > 0 ? `${Math.round((t.egresos / t.ingresos) * 100)}% de lo que entró` : null} />
      </div>

      {pendientes.length > 0 && mes === mesDe(hoyISO()) && (
        <section className="grupo">
          <h2 className="grupo-titulo">Por vencer este mes</h2>
          <ul className="lista lista-simple">
            {pendientes.map((v) => (
              <li key={v.id} className={"item" + (v.dias < 0 ? " item-alerta" : "")}>
                <span className="item-titulo">{v.nombre}</span>
                <span className="item-meta">día {v.dia_mes}</span>
                <span className="item-monto">{plata(v.monto)}</span>
                <button className="btn btn-chico"
                  onClick={() => vencimientos.actualizar(v.id, { pagado_hasta: primerDiaDe(mes) })}>
                  Pagado
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AltaMovimiento
        categorias={categorias.filas}
        alCrear={(datos) => movimientos.crear(datos)}
        mes={mes}
      />

      <div className="dos-columnas">
        <section className="grupo">
          <h2 className="grupo-titulo">Movimientos <span className="grupo-cuenta">{delMes.length}</span></h2>
          {delMes.length === 0 ? (
            <Vacio icono="$" titulo="Sin movimientos este mes"
              texto="Cargá el primero con el formulario de arriba." />
          ) : (
            <ul className="lista">
              {delMes.map((m) => (
                <li key={m.id} className="item">
                  <span className={"mov-tipo mov-" + m.tipo} aria-hidden="true">
                    {m.tipo === "ingreso" ? "+" : "−"}
                  </span>
                  <button className="item-cuerpo" onClick={() => setEditando(m)}>
                    <span className="item-titulo">
                      {m.detalle || nombreCat[m.categoria_id]?.nombre || "Sin detalle"}
                    </span>
                    <span className="item-meta">
                      {fechaRelativa(m.fecha)}
                      {m.categoria_id && nombreCat[m.categoria_id] && (
                        <span className="etiqueta" style={{ "--chip": nombreCat[m.categoria_id].color }}>
                          {nombreCat[m.categoria_id].nombre}
                        </span>
                      )}
                      {m.medio && <span>{m.medio}</span>}
                    </span>
                  </button>
                  <span className={"item-monto item-monto-" + m.tipo}>{plata(m.monto)}</span>
                  <button className="item-borrar"
                    onClick={async () => {
                      if (await confirmar(`Se borra el movimiento de ${plata(m.monto)}.`))
                        movimientos.borrar(m.id);
                    }}
                    aria-label="Borrar">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grupo">
          <h2 className="grupo-titulo">En qué se fue</h2>
          {gastos.length === 0 ? (
            <p className="pista">Sin egresos este mes.</p>
          ) : (
            <ul className="lista lista-simple">
              {gastos.map((g) => (
                <li key={g.id} className="gasto">
                  <div className="gasto-cab">
                    <span>{g.nombre}</span>
                    <b>{plata(g.total)}</b>
                  </div>
                  <Progreso valor={g.total} maximo={t.egresos} color={g.color} />
                  <small>{Math.round((g.total / t.egresos) * 100)}%</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editando && (
        <ModalMovimiento movimiento={editando} categorias={categorias.filas}
          alCerrar={() => setEditando(null)}
          alGuardar={async (datos) => {
            await movimientos.actualizar(editando.id, datos);
            setEditando(null);
          }} />
      )}

      {verCategorias && (
        <ModalCategorias categorias={categorias} confirmar={confirmar}
          alCerrar={() => setVerCategorias(false)} />
      )}

      {verVencimientos && (
        <ModalVencimientos vencimientos={vencimientos} mes={mes} confirmar={confirmar}
          alCerrar={() => setVerVencimientos(false)} />
      )}

      {dialogo}
    </div>
  );
}

function AltaMovimiento({ categorias, alCrear, mes }) {
  const hoy = hoyISO();
  const vacio = {
    tipo: "egreso",
    monto: "",
    categoria_id: "",
    detalle: "",
    medio: "",
    // Si estás mirando un mes pasado, la fecha arranca en ese mes y no en hoy.
    fecha: mes === mesDe(hoy) ? hoy : primerDiaDe(mes),
  };
  const [f, setF] = useState(vacio);
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const delTipo = categorias.filter((c) => c.tipo === f.tipo);

  return (
    <form className="alta-mov" onSubmit={(e) => {
      e.preventDefault();
      if (!f.monto) return;
      alCrear({
        tipo: f.tipo,
        monto: Number(f.monto),
        categoria_id: f.categoria_id || null,
        detalle: f.detalle.trim() || null,
        medio: f.medio || null,
        fecha: f.fecha,
      });
      setF({ ...vacio, tipo: f.tipo, categoria_id: f.categoria_id, medio: f.medio });
    }}>
      <select value={f.tipo} onChange={(e) => cambiar("tipo", e.target.value)} aria-label="Tipo">
        <option value="egreso">Egreso</option>
        <option value="ingreso">Ingreso</option>
      </select>

      <input type="number" step="0.01" value={f.monto} placeholder="Monto"
        onChange={(e) => cambiar("monto", e.target.value)} aria-label="Monto" />

      <input value={f.detalle} placeholder="Detalle"
        onChange={(e) => cambiar("detalle", e.target.value)} aria-label="Detalle" />

      <select value={f.categoria_id} onChange={(e) => cambiar("categoria_id", e.target.value)}
        aria-label="Categoría">
        <option value="">Categoría</option>
        {delTipo.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>

      <select value={f.medio} onChange={(e) => cambiar("medio", e.target.value)} aria-label="Medio">
        <option value="">Medio</option>
        {MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <input type="date" value={f.fecha} onChange={(e) => cambiar("fecha", e.target.value)}
        aria-label="Fecha" />

      <button className="btn btn-primario" disabled={!f.monto}>Cargar</button>
    </form>
  );
}

function ModalMovimiento({ movimiento, categorias, alGuardar, alCerrar }) {
  const [f, setF] = useState({
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    categoria_id: movimiento.categoria_id || "",
    detalle: movimiento.detalle || "",
    medio: movimiento.medio || "",
    fecha: movimiento.fecha,
  });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));

  return (
    <Modal titulo="Editar movimiento" alCerrar={alCerrar}
      pie={
        <>
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario"
            onClick={() => alGuardar({
              tipo: f.tipo,
              monto: Number(f.monto) || 0,
              categoria_id: f.categoria_id || null,
              detalle: f.detalle.trim() || null,
              medio: f.medio || null,
              fecha: f.fecha,
            })}>
            Guardar
          </button>
        </>
      }>
      <Fila>
        <Campo etiqueta="Tipo" ancho={130}>
          <select value={f.tipo} onChange={(e) => cambiar("tipo", e.target.value)}>
            <option value="egreso">Egreso</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </Campo>
        <Campo etiqueta="Monto" ancho={130}>
          <input type="number" step="0.01" value={f.monto}
            onChange={(e) => cambiar("monto", e.target.value)} />
        </Campo>
        <Campo etiqueta="Fecha" ancho={140}>
          <input type="date" value={f.fecha} onChange={(e) => cambiar("fecha", e.target.value)} />
        </Campo>
      </Fila>

      <Campo etiqueta="Detalle">
        <input value={f.detalle} onChange={(e) => cambiar("detalle", e.target.value)} />
      </Campo>

      <Fila>
        <Campo etiqueta="Categoría" ancho={180}>
          <select value={f.categoria_id} onChange={(e) => cambiar("categoria_id", e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias.filter((c) => c.tipo === f.tipo).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Medio" ancho={160}>
          <select value={f.medio} onChange={(e) => cambiar("medio", e.target.value)}>
            <option value="">—</option>
            {MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Campo>
      </Fila>
    </Modal>
  );
}

function ModalCategorias({ categorias, confirmar, alCerrar }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("egreso");
  const [color, setColor] = useState("#e0a458");

  return (
    <Modal titulo="Categorías" alCerrar={alCerrar}>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        categorias.crear({ nombre: nombre.trim(), tipo, color });
        setNombre("");
      }}>
        <Fila>
          <Campo etiqueta="Nombre" ancho={180}>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Comida, alquiler, sueldo..." />
          </Campo>
          <Campo etiqueta="Tipo" ancho={130}>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="egreso">Egreso</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </Campo>
        </Fila>
        <SelectorColor valor={color} alCambiar={setColor} />
        <button className="btn btn-primario" disabled={!nombre.trim()}>Agregar</button>
      </form>

      <ul className="lista lista-simple">
        {categorias.filas.map((c) => (
          <li key={c.id} className="item">
            <span className="punto" style={{ background: c.color }} />
            <span className="item-titulo">{c.nombre}</span>
            <span className="item-meta">{c.tipo}</span>
            <button className="item-borrar"
              onClick={async () => {
                if (await confirmar(
                  `Se borra "${c.nombre}". Los movimientos quedan sin categoría, no se borran.`
                )) categorias.borrar(c.id);
              }}
              aria-label="Borrar">×</button>
          </li>
        ))}
        {!categorias.filas.length && <li className="lista-nota">Todavía no hay categorías.</li>}
      </ul>
    </Modal>
  );
}

function ModalVencimientos({ vencimientos, mes, confirmar, alCerrar }) {
  const [f, setF] = useState({ nombre: "", monto: "", dia_mes: 1 });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));

  return (
    <Modal titulo="Vencimientos fijos" alCerrar={alCerrar}>
      <p className="campo-ayuda">
        Lo que se repite todos los meses: alquiler, servicios, cuotas. Marcar
        "pagado" no carga el movimiento: solo lo saca de la lista de este mes.
      </p>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (!f.nombre.trim()) return;
        vencimientos.crear({
          nombre: f.nombre.trim(),
          monto: Number(f.monto) || 0,
          dia_mes: Number(f.dia_mes) || 1,
        });
        setF({ nombre: "", monto: "", dia_mes: 1 });
      }}>
        <Fila>
          <Campo etiqueta="Nombre" ancho={180}>
            <input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)} />
          </Campo>
          <Campo etiqueta="Monto" ancho={120}>
            <input type="number" step="0.01" value={f.monto}
              onChange={(e) => cambiar("monto", e.target.value)} />
          </Campo>
          <Campo etiqueta="Día del mes" ancho={110}>
            <input type="number" min={1} max={31} value={f.dia_mes}
              onChange={(e) => cambiar("dia_mes", e.target.value)} />
          </Campo>
        </Fila>
        <button className="btn btn-primario" disabled={!f.nombre.trim()}>Agregar</button>
      </form>

      <ul className="lista lista-simple">
        {vencimientos.filas.map((v) => {
          const pagado = estaPagado(v, mes);
          return (
            <li key={v.id} className={"item" + (v.activo ? "" : " item-hecho")}>
              <span className="item-titulo">{v.nombre}</span>
              <span className="item-meta">día {v.dia_mes}</span>
              <span className="item-monto">{plata(v.monto)}</span>
              <button className="btn btn-chico"
                onClick={() => vencimientos.actualizar(v.id, {
                  pagado_hasta: pagado ? null : primerDiaDe(mes),
                })}>
                {pagado ? "Deshacer" : "Pagado"}
              </button>
              <button className="item-borrar"
                onClick={async () => {
                  if (await confirmar(`Se borra el vencimiento "${v.nombre}".`))
                    vencimientos.borrar(v.id);
                }}
                aria-label="Borrar">×</button>
            </li>
          );
        })}
        {!vencimientos.filas.length && <li className="lista-nota">No hay vencimientos cargados.</li>}
      </ul>
    </Modal>
  );
}
