import tareas from "../modulos/tareas/index.js";
import habitos from "../modulos/habitos/index.js";
import rutina from "../modulos/rutina/index.js";
import entrenamiento from "../modulos/entrenamiento/index.js";
import dieta from "../modulos/dieta/index.js";
import finanzas from "../modulos/finanzas/index.js";
import ajustes from "../modulos/ajustes/index.js";

/**
 * EL REGISTRO DE MÓDULOS
 * ----------------------
 * Este archivo es el único lugar de la app que sabe qué módulos existen.
 * El menú, las rutas y la pantalla de Hoy se arman solos a partir de esta lista.
 *
 * Para sumar un módulo nuevo:
 *   1. Creá la carpeta src/modulos/<nombre>/ con un index.js que exporte el
 *      manifiesto (mirá cualquiera de los de abajo como molde).
 *   2. Importalo acá y agregalo al array.
 *   3. Listo. No hay que tocar ningún otro archivo.
 *
 * Forma del manifiesto:
 *   id        identificador corto, sale en la URL (#/tareas)
 *   nombre    como aparece en el menú
 *   icono     un carácter o emoji
 *   color     color de acento del módulo
 *   Pantalla  componente React de la pantalla completa
 *   Resumen   (opcional) tarjetita que el módulo aporta a la pantalla de Hoy
 *   tablas    tablas de la base que usa, solo a modo de documentación
 *   secundario  (opcional) true lo manda al pie del menú, después del separador
 */

export const MODULOS = [tareas, habitos, rutina, entrenamiento, dieta, finanzas, ajustes];

export function moduloPorId(id) {
  return MODULOS.find((m) => m.id === id);
}
