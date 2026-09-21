import { Pantalla } from "./Pantalla.jsx";

export default {
  id: "ajustes",
  nombre: "Ajustes",
  icono: "⚙",
  color: "#7f8fa6",
  Pantalla,
  // Sin Resumen: no aporta tarjeta a Hoy.
  // Va después del separador, al pie del menú.
  secundario: true,
  tablas: ["perfil"],
};
