import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import {
  habitosStore, registrosStore, indexar, racha, adherencia,
  tocaEseDia, cumplido, desdeCuando,
} from "./datos.js";
import { DIAS, hoyISO, inicioSemana, semanaDe, sumarDias, desdeISO } from "../../core/fecha.js";
import {
  Cabecera, Campo, Cargando, ErrorCaja, Fila, Modal,
  SelectorColor, Vacio, useConfirmar,
} from "../../core/ui/index.jsx";

export function Pantalla() {
  const habitos = useTabla(habitosStore);
  const registros = useTabla(registrosStore, {
    filtros: { fecha: { op: "gte", valor: desdeCuando() } },
  });
  const { confirmar, dialogo } = useConfirmar();

  const hoy = hoyISO();
  const [lunes, setLunes] = useState(() => inicioSemana(hoy));
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);

  const dias = useMemo(() => semanaDe(lunes), [lunes]);
  const indice = useMemo(() => indexar(registros.filas), [registros.filas]);
  const activos = habitos.filas.filter((h) => h.activo);

  /** Un toque suma; al llegar a la meta y tocar de nuevo, vuelve a cero. */
  async function marcar(habito, fecha) {
    if (fecha > hoy) return; // no se marca el futuro
    const reg = indice.get(habito.id + "|" + fecha);
    const meta = Number(habito.meta_diaria || 1);

    if (!reg) return registros.crear({ habito_id: habito.id, fecha, valor: 1 });
    const nuevo = Number(reg.valor) + 1;
    if (nuevo > meta) return registros.borrar(reg.id);
    return registros.actualizar(reg.id, { valor: nuevo });
  }

  if (habitos.cargando && !habitos.filas.length) return <Cargando />;

  return (
    <div className="pantalla">
      <Cabecera titulo="Hábitos" subtitulo={`${activos.length} activo${activos.length === 1 ? "" : "s"}`}>
        <button className="btn btn-primario" onClick={() => setCreando(true)}>Nuevo hábito</button>
      </Cabecera>

      <ErrorCaja error={habitos.error || registros.error} alReintentar={habitos.recargar} />

      {activos.length === 0 ? (
        <Vacio icono="◇" titulo="Todavía no hay hábitos"
          texto="Empezá por uno solo. Es más fácil sostener uno que cinco."
          accion={<button className="btn btn-primario" onClick={() => setCreando(true)}>Crear el primero</button>} />
      ) : (
        <>
          <div className="semana-nav">
            <button className="btn btn-chico" onClick={() => setLunes(sumarDias(lunes, -7))}>‹</button>
            <span>{rotuloSemana(lunes)}</span>
            <button className="btn btn-chico" onClick={() => setLunes(sumarDias(lunes, 7))}
              disabled={lunes >= inicioSemana(hoy)}>›</button>
            {lunes !== inicioSemana(hoy) && (
              <button className="btn btn-chico" onClick={() => setLunes(inicioSemana(hoy))}>Hoy</button>
            )}
          </div>

          <div className="grilla-habitos">
            <div className="grilla-cab">
              <span />
              {dias.map((f, i) => (
                <span key={f} className={"grilla-dia" + (f === hoy ? " grilla-dia-hoy" : "")}>
                  <small>{DIAS[i]}</small>
                  <b>{desdeISO(f).getDate()}</b>
                </span>
              ))}
              <span className="grilla-racha">Racha</span>
            </div>

            {activos.map((h) => (
              <div key={h.id} className="grilla-fila" style={{ "--acento": h.color }}>
                <button className="grilla-nombre" onClick={() => setEditando(h)}>
                  <span className="punto" style={{ background: h.color }} />
                  <span>{h.nombre}</span>
                  {h.meta_diaria > 1 && <small>{h.meta_diaria} {h.unidad || "veces"}</small>}
                </button>

                {dias.map((f) => {
                  const toca = tocaEseDia(h, f);
                  const reg = indice.get(h.id + "|" + f);
                  const ok = cumplido(h, reg);
                  const parcial = reg && !ok;
                  return (
                    <button key={f}
                      className={
                        "celda" +
                        (!toca ? " celda-off" : "") +
                        (ok ? " celda-ok" : "") +
                        (parcial ? " celda-parcial" : "") +
                        (f > hoy ? " celda-futura" : "")
                      }
                      style={{ background: ok ? h.color : undefined }}
                      onClick={() => marcar(h, f)}
                      disabled={!toca || f > hoy}
                      aria-label={`${h.nombre} el ${f}`}
                      title={toca ? "" : "Este día no toca"}>
                      {ok ? "✓" : parcial ? reg.valor : ""}
                    </button>
                  );
                })}

                <span className="grilla-racha">
                  {(() => {
                    const r = racha(h, indice, hoy);
                    return r > 0 ? <b>{r}</b> : <small>—</small>;
                  })()}
                </span>
              </div>
            ))}
          </div>

          <div className="tarjetas-mini">
            {activos.map((h) => {
              const a = adherencia(h, indice, 30, hoy);
              return (
                <div key={h.id} className="mini" style={{ "--acento": h.color }}>
                  <span className="mini-nombre">{h.nombre}</span>
                  <b className="mini-valor">{a === null ? "—" : a + "%"}</b>
                  <small>últimos 30 días</small>
                </div>
              );
            })}
          </div>
        </>
      )}

      {(creando || editando) && (
        <ModalHabito
          habito={editando}
          alCerrar={() => { setCreando(false); setEditando(null); }}
          alGuardar={async (datos) => {
            if (editando) await habitos.actualizar(editando.id, datos);
            else await habitos.crear(datos);
            setCreando(false);
            setEditando(null);
          }}
          alBorrar={editando ? async () => {
            if (await confirmar(`Se borra "${editando.nombre}" y todo su historial.`)) {
              await habitos.borrar(editando.id);
              setEditando(null);
            }
          } : null}
        />
      )}

      {dialogo}
    </div>
  );
}

function rotuloSemana(lunes) {
  const domingo = sumarDias(lunes, 6);
  const f = (iso) => `${desdeISO(iso).getDate()}/${desdeISO(iso).getMonth() + 1}`;
  return `${f(lunes)} al ${f(domingo)}`;
}

function ModalHabito({ habito, alGuardar, alCerrar, alBorrar }) {
  const [f, setF] = useState({
    nombre: habito?.nombre || "",
    color: habito?.color || "#4fb286",
    meta_diaria: habito?.meta_diaria ?? 1,
    unidad: habito?.unidad || "",
    dias: habito?.dias || [0, 1, 2, 3, 4, 5, 6],
    activo: habito?.activo ?? true,
  });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));

  function alternarDia(i) {
    const d = f.dias.includes(i) ? f.dias.filter((x) => x !== i) : [...f.dias, i].sort();
    if (d.length) cambiar("dias", d);  // al menos un día, si no el hábito no existe
  }

  return (
    <Modal titulo={habito ? "Editar hábito" : "Nuevo hábito"} alCerrar={alCerrar}
      pie={
        <>
          {alBorrar && <button className="btn btn-peligro" onClick={alBorrar}>Borrar</button>}
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={!f.nombre.trim()}
            onClick={() => alGuardar({
              nombre: f.nombre.trim(),
              color: f.color,
              meta_diaria: Number(f.meta_diaria) || 1,
              unidad: f.unidad.trim() || null,
              dias: f.dias,
              activo: f.activo,
            })}>
            Guardar
          </button>
        </>
      }>
      <Campo etiqueta="Nombre">
        <input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)}
          placeholder="Tomar agua, leer, estirar..." autoFocus />
      </Campo>

      <Fila>
        <Campo etiqueta="Meta por día" ancho={120}
          ayuda="1 = hecho o no hecho">
          <input type="number" min={1} value={f.meta_diaria}
            onChange={(e) => cambiar("meta_diaria", e.target.value)} />
        </Campo>
        <Campo etiqueta="Unidad" ancho={140} ayuda="opcional">
          <input value={f.unidad} onChange={(e) => cambiar("unidad", e.target.value)}
            placeholder="vasos, minutos..." />
        </Campo>
      </Fila>

      <Campo etiqueta="Qué días">
        <div className="dias-selector">
          {DIAS.map((d, i) => (
            <button key={d} type="button"
              className={"dia" + (f.dias.includes(i) ? " dia-on" : "")}
              onClick={() => alternarDia(i)}>{d}</button>
          ))}
        </div>
      </Campo>

      <Campo etiqueta="Color">
        <SelectorColor valor={f.color} alCambiar={(c) => cambiar("color", c)} />
      </Campo>

      {habito && (
        <label className="check">
          <input type="checkbox" checked={f.activo}
            onChange={(e) => cambiar("activo", e.target.checked)} />
          <span>Activo (destildalo para archivarlo sin perder el historial)</span>
        </label>
      )}
    </Modal>
  );
}
