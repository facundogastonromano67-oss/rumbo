import { useMemo, useState } from "react";
import { useTabla } from "../../core/sincronizacion.js";
import { bloquesStore, aMinutos, aHora, ventana, bloquesDelDia, horasPorDia } from "./datos.js";
import { DIAS, DIAS_LARGO, diaSemana, hoyISO } from "../../core/fecha.js";
import {
  Cabecera, Campo, Cargando, ErrorCaja, Fila, Modal,
  SelectorColor, Vacio, useConfirmar,
} from "../../core/ui/index.jsx";

export function Pantalla() {
  const bloques = useTabla(bloquesStore);
  const { confirmar, dialogo } = useConfirmar();
  const [editando, setEditando] = useState(null); // bloque, o { dia_semana } para crear

  const hoy = diaSemana(hoyISO());
  const { desde, hasta } = useMemo(() => ventana(bloques.filas), [bloques.filas]);
  const alto = hasta - desde;
  const horas = useMemo(() => horasPorDia(bloques.filas), [bloques.filas]);

  const marcasHora = [];
  for (let m = desde; m <= hasta; m += 60) marcasHora.push(m);

  if (bloques.cargando && !bloques.filas.length) return <Cargando />;

  return (
    <div className="pantalla">
      <Cabecera titulo="Rutina" subtitulo="Cómo es tu semana típica">
        <button className="btn btn-primario" onClick={() => setEditando({ dia_semana: hoy })}>
          Nuevo bloque
        </button>
      </Cabecera>

      <ErrorCaja error={bloques.error} alReintentar={bloques.recargar} />

      {bloques.filas.length === 0 ? (
        <Vacio icono="▤" titulo="La semana está en blanco"
          texto="Cargá los bloques fijos: trabajo, gimnasio, comidas, descanso. Lo que se repite todas las semanas."
          accion={<button className="btn btn-primario" onClick={() => setEditando({ dia_semana: hoy })}>
            Cargar el primero</button>} />
      ) : (
        <div className="agenda">
          <div className="agenda-horas">
            {marcasHora.map((m) => (
              <span key={m} className="agenda-hora"
                style={{ top: ((m - desde) / alto) * 100 + "%" }}>
                {aHora(m)}
              </span>
            ))}
          </div>

          <div className="agenda-dias">
            {DIAS.map((d, i) => (
              <div key={d} className={"agenda-col" + (i === hoy ? " agenda-col-hoy" : "")}>
                <header className="agenda-col-cab">
                  <span>{d}</span>
                  {horas[i] > 0 && <small>{horas[i].toFixed(1).replace(".0", "")} h</small>}
                </header>

                <div className="agenda-pista" onDoubleClick={() => setEditando({ dia_semana: i })}>
                  {marcasHora.map((m) => (
                    <div key={m} className="agenda-linea"
                      style={{ top: ((m - desde) / alto) * 100 + "%" }} />
                  ))}

                  {bloquesDelDia(bloques.filas, i).map((b) => {
                    const ini = aMinutos(b.hora_inicio);
                    const fin = Math.max(aMinutos(b.hora_fin), ini + 20); // mínimo legible
                    return (
                      <button key={b.id} className="agenda-bloque"
                        style={{
                          top: ((ini - desde) / alto) * 100 + "%",
                          height: ((fin - ini) / alto) * 100 + "%",
                          background: b.color,
                        }}
                        onClick={() => setEditando(b)}
                        title={`${b.nombre} · ${b.hora_inicio.slice(0, 5)}–${b.hora_fin.slice(0, 5)}`}>
                        <span className="agenda-bloque-nombre">{b.nombre}</span>
                        <span className="agenda-bloque-hora">{b.hora_inicio.slice(0, 5)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="pista">Doble clic en una columna para agregar un bloque ese día.</p>

      {editando && (
        <ModalBloque
          bloque={editando.id ? editando : null}
          diaInicial={editando.dia_semana}
          alCerrar={() => setEditando(null)}
          alGuardar={async (datos) => {
            if (editando.id) await bloques.actualizar(editando.id, datos);
            else await bloques.crear(datos);
            setEditando(null);
          }}
          alBorrar={editando.id ? async () => {
            if (await confirmar(`Se borra el bloque "${editando.nombre}".`)) {
              await bloques.borrar(editando.id);
              setEditando(null);
            }
          } : null}
        />
      )}

      {dialogo}
    </div>
  );
}

function ModalBloque({ bloque, diaInicial, alGuardar, alCerrar, alBorrar }) {
  const [f, setF] = useState({
    nombre: bloque?.nombre || "",
    dia_semana: bloque?.dia_semana ?? diaInicial ?? 0,
    hora_inicio: (bloque?.hora_inicio || "09:00").slice(0, 5),
    hora_fin: (bloque?.hora_fin || "10:00").slice(0, 5),
    color: bloque?.color || "#9b7fd4",
    notas: bloque?.notas || "",
    repetirEn: [],
  });
  const cambiar = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const invertido = aMinutos(f.hora_fin) <= aMinutos(f.hora_inicio);

  return (
    <Modal titulo={bloque ? "Editar bloque" : "Nuevo bloque"} alCerrar={alCerrar}
      pie={
        <>
          {alBorrar && <button className="btn btn-peligro" onClick={alBorrar}>Borrar</button>}
          <button className="btn" onClick={alCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={!f.nombre.trim() || invertido}
            onClick={() => alGuardar({
              nombre: f.nombre.trim(),
              dia_semana: Number(f.dia_semana),
              hora_inicio: f.hora_inicio,
              hora_fin: f.hora_fin,
              color: f.color,
              notas: f.notas.trim() || null,
            })}>
            Guardar
          </button>
        </>
      }>
      <Campo etiqueta="Nombre">
        <input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)}
          placeholder="Trabajo, gimnasio, almuerzo..." autoFocus />
      </Campo>

      <Campo etiqueta="Día">
        <select value={f.dia_semana} onChange={(e) => cambiar("dia_semana", e.target.value)}>
          {DIAS_LARGO.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
      </Campo>

      <Fila>
        <Campo etiqueta="Desde" ancho={120}>
          <input type="time" value={f.hora_inicio}
            onChange={(e) => cambiar("hora_inicio", e.target.value)} />
        </Campo>
        <Campo etiqueta="Hasta" ancho={120}>
          <input type="time" value={f.hora_fin}
            onChange={(e) => cambiar("hora_fin", e.target.value)} />
        </Campo>
      </Fila>

      {invertido && <p className="campo-error">La hora de fin tiene que ser posterior a la de inicio.</p>}

      <Campo etiqueta="Color">
        <SelectorColor valor={f.color} alCambiar={(c) => cambiar("color", c)} />
      </Campo>

      <Campo etiqueta="Notas">
        <textarea rows={3} value={f.notas} onChange={(e) => cambiar("notas", e.target.value)} />
      </Campo>
    </Modal>
  );
}
