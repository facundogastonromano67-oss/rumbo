import { Pantalla } from "./Pantalla.jsx";
import { Resumen } from "./Resumen.jsx";

/** Manifiesto del módulo. Esto es todo lo que la app necesita saber de Tareas. */
export default {
  id: "tareas",
  nombre: "Tareas",
  icono: "✓",
  color: "#ffa63d",
  Pantalla,
  Resumen,
  tablas: ["tareas", "proyectos"],
};
