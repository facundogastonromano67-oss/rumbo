import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const Ctx = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const valor = {
    sesion,
    usuario: sesion?.user ?? null,
    cargando,
    salir: () => supabase.auth.signOut(),
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSesion() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSesion() fuera de <ProveedorSesion>");
  return v;
}

/** Traduce los errores de Supabase, que vienen en inglés y sin contexto. */
function mensajeError(e) {
  const m = (e?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Mail o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Falta confirmar el mail. Revisá tu casilla.";
  if (m.includes("already registered")) return "Ese mail ya tiene cuenta. Probá iniciar sesión.";
  if (m.includes("password")) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Esperá un minuto.";
  return e?.message || "No se pudo completar. Probá de nuevo.";
}

export function PantallaAcceso() {
  const [modo, setModo] = useState("entrar");
  const [mail, setMail] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password: clave });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password: clave,
          options: { data: { nombre } },
        });
        if (error) throw error;
        if (!data.session) setAviso("Cuenta creada. Confirmá el mail que te llegó y volvé a entrar.");
      }
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="acceso">
      <form className="acceso-caja" onSubmit={enviar}>
        <div className="acceso-marca">
          <span className="acceso-punto" />
          <h1>Rumbo</h1>
        </div>
        <p className="acceso-bajada">Tu vida, ordenada en un solo lugar.</p>

        {modo === "crear" && (
          <label className="campo">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Cómo te llamás" autoComplete="name" required />
          </label>
        )}

        <label className="campo">
          <span>Mail</span>
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)}
            placeholder="vos@mail.com" autoComplete="email" required />
        </label>

        <label className="campo">
          <span>Contraseña</span>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)}
            placeholder="Al menos 6 caracteres" minLength={6}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"} required />
        </label>

        {error && <p className="acceso-error">{error}</p>}
        {aviso && <p className="acceso-aviso">{aviso}</p>}

        <button className="btn btn-primario btn-ancho" disabled={enviando}>
          {enviando ? "Un momento..." : modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>

        <button type="button" className="acceso-cambiar"
          onClick={() => { setModo(modo === "entrar" ? "crear" : "entrar"); setError(null); setAviso(null); }}>
          {modo === "entrar" ? "No tengo cuenta todavía" : "Ya tengo cuenta"}
        </button>
      </form>
    </div>
  );
}
