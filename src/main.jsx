import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import { ProveedorSesion } from "./core/auth.jsx";
import { ProveedorPerfil } from "./core/perfil.jsx";
import { sinConfigurar } from "./core/supabase.js";
import "./estilos/base.css";

const raiz = createRoot(document.getElementById("root"));

// Sin .env no hay cliente de Supabase, así que tampoco puede haber proveedor de
// sesión: la app muestra sola las instrucciones de configuración.
raiz.render(
  <React.StrictMode>
    {sinConfigurar ? (
      <App />
    ) : (
      <ProveedorSesion>
        <ProveedorPerfil>
          <App />
        </ProveedorPerfil>
      </ProveedorSesion>
    )}
  </React.StrictMode>
);
