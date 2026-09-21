import { useEffect, useState } from "react";
import { usePerfil } from "../../core/perfil.jsx";
import { NIVELES_ACTIVIDAD, OBJETIVOS, SEXOS } from "../../core/salud.js";
import { useSesion } from "../../core/auth.jsx";
import { textoEdad } from "../../core/fecha.js";
import { Cabecera, Campo, Cargando, ErrorCaja, Fila } from "../../core/ui/index.jsx";

export function Pantalla() {
  const { perfil, cargando, error, guardar } = usePerfil();
  const { usuario } = useSesion();

  const [f, setF] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // El formulario se arma recién cuando llegó el perfil; antes no hay qué mostrar.
  useEffect(() => {
    if (cargando) return;
    setF({
      nombre: perfil?.nombre || usuario?.user_metadata?.nombre || "",
      fecha_nacimiento: perfil?.fecha_nacimiento || "",
      sexo: perfil?.sexo || "",
      altura_cm: perfil?.altura_cm ?? "",
      peso_kg: perfil?.peso_kg ?? "",
      nivel_actividad: perfil?.nivel_actividad || "moderado",
      objetivo: perfil?.objetivo || "mantener",
    });
  }, [cargando, perfil, usuario]);

  const cambiar = (k, v) => {
    setF((x) => ({ ...x, [k]: v }));
    setGuardado(false);
  };

  async function enviar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardar({
        nombre: f.nombre.trim() || null,
        fecha_nacimiento: f.fecha_nacimiento || null,
        sexo: f.sexo || null,
        altura_cm: f.altura_cm === "" ? null : Number(f.altura_cm),
        peso_kg: f.peso_kg === "" ? null : Number(f.peso_kg),
        nivel_actividad: f.nivel_actividad,
        objetivo: f.objetivo,
      });
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando || !f) return <Cargando />;

  return (
    <div className="pantalla pantalla-angosta">
      <Cabecera titulo="Ajustes" subtitulo="Tus datos. Con esto se arman la rutina y la dieta." />

      <ErrorCaja error={error} />

      <form onSubmit={enviar}>
        <section className="seccion">
          <h2 className="seccion-titulo">Quién sos</h2>

          <Campo etiqueta="Nombre">
            <input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)}
              placeholder="Cómo querés que te salude" />
          </Campo>

          <Fila>
            <Campo etiqueta="Fecha de nacimiento" ancho={180}
              ayuda={f.fecha_nacimiento ? textoEdad(f.fecha_nacimiento) : "Sale en el panel lateral"}>
              <input type="date" value={f.fecha_nacimiento}
                onChange={(e) => cambiar("fecha_nacimiento", e.target.value)} />
            </Campo>

            <Campo etiqueta="Sexo" ancho={160}
              ayuda="Cambia el cálculo de calorías">
              <select value={f.sexo} onChange={(e) => cambiar("sexo", e.target.value)}>
                <option value="">Sin indicar</option>
                {SEXOS.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Campo>
          </Fila>
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Tu cuerpo</h2>

          <Fila>
            <Campo etiqueta="Altura (cm)" ancho={140}>
              <input type="number" min={100} max={250} value={f.altura_cm}
                onChange={(e) => cambiar("altura_cm", e.target.value)} placeholder="175" />
            </Campo>
            <Campo etiqueta="Peso (kg)" ancho={140}>
              <input type="number" step="0.1" min={30} max={300} value={f.peso_kg}
                onChange={(e) => cambiar("peso_kg", e.target.value)} placeholder="78" />
            </Campo>
          </Fila>
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Tu actividad</h2>
          <p className="seccion-ayuda">
            Cuánto te movés en un día normal, contando el trabajo. No solo el entrenamiento.
          </p>

          <div className="opciones">
            {NIVELES_ACTIVIDAD.map((n) => (
              <button key={n.id} type="button"
                className={"opcion" + (f.nivel_actividad === n.id ? " opcion-activa" : "")}
                onClick={() => cambiar("nivel_actividad", n.id)}>
                <strong>{n.nombre}</strong>
                <small>{n.detalle}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Tu objetivo</h2>

          <div className="opciones">
            {OBJETIVOS.map((o) => (
              <button key={o.id} type="button"
                className={"opcion" + (f.objetivo === o.id ? " opcion-activa" : "")}
                onClick={() => cambiar("objetivo", o.id)}>
                <strong>{o.nombre}</strong>
                <small>
                  {o.ajuste === 0
                    ? "Las calorías que gastás"
                    : `${o.ajuste > 0 ? "+" : ""}${Math.round(o.ajuste * 100)}% sobre lo que gastás`}
                </small>
              </button>
            ))}
          </div>
        </section>

        <div className="acciones-form">
          <button className="btn btn-primario" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          {guardado && <span className="guardado">Guardado</span>}
        </div>
      </form>

      <section className="seccion">
        <h2 className="seccion-titulo">Cuenta</h2>
        <p className="seccion-ayuda">Entrás con <strong>{usuario?.email}</strong>.</p>
      </section>
    </div>
  );
}
