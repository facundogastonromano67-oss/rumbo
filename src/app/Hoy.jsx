import React from "react";
import { MODULOS } from "./registro.js";
import { useSesion } from "../core/auth.jsx";
import { DIAS_LARGO, diaSemana, hoyISO, desdeISO } from "../core/fecha.js";

/**
 * Pantalla de inicio. No sabe nada de ningún módulo en particular: muestra el
 * Resumen de cada módulo que aporte uno. Un módulo nuevo con Resumen aparece
 * acá solo, sin tocar este archivo.
 */
export function Hoy() {
  const { usuario } = useSesion();
  const nombre = usuario?.user_metadata?.nombre?.split(" ")[0] || "";
  const hoy = hoyISO();
  const d = desdeISO(hoy);

  const conResumen = MODULOS.filter((m) => m.Resumen);

  return (
    <div className="pantalla">
      <header className="hoy-cab">
        <h1>{saludo()}{nombre ? `, ${nombre}` : ""}</h1>
        <p>{DIAS_LARGO[diaSemana(hoy)]} {d.getDate()} de {mes(d)}</p>
      </header>

      <div className="tarjetas">
        {conResumen.map((m) => (
          <LimiteDeError key={m.id} modulo={m.nombre}>
            <m.Resumen />
          </LimiteDeError>
        ))}
      </div>
    </div>
  );
}

function saludo() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function mes(d) {
  return ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"][d.getMonth()];
}

/**
 * Si un módulo falla, se cae solo su tarjeta y el resto de la pantalla sigue
 * funcionando. Sin esto, un error en cualquier resumen deja la pantalla en blanco.
 */
class LimiteDeError extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <article className="tarjeta tarjeta-rota">
          <h2>{this.props.modulo}</h2>
          <p>No se pudo mostrar este resumen.</p>
          <small>{this.state.error.message}</small>
        </article>
      );
    }
    return this.props.children;
  }
}
