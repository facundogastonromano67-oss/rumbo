# Rumbo

App para organizar la vida personal, armada por módulos. Hoy tiene siete:
Tareas, Hábitos, Rutina, Entrenamiento, Dieta, Finanzas y Ajustes.

React + Vite del lado del navegador, Supabase (Postgres + Auth) del lado de los datos.
Tema oscuro con acento naranja, panel lateral fijo con la fecha y el contador
de días.

---

## Arrancar por primera vez

**1. Crear el proyecto de Supabase.**
Entrá a [supabase.com](https://supabase.com), creá un proyecto nuevo (uno
propio, aparte del de Decoglass, para que no compartan la cuota de egreso) y
esperá a que termine de levantar.

**2. Cargar el esquema y los catálogos.**
En el panel de Supabase, **SQL Editor › New query**, y corré en este orden:

1. [`sql/01-esquema.sql`](sql/01-esquema.sql) — las tablas, RLS y los triggers.
2. [`sql/02-catalogos.sql`](sql/02-catalogos.sql) — 116 ejercicios y 121 alimentos
   con su aporte nutricional.

Los dos se pueden volver a correr sin romper ni duplicar nada.

**3. Conectar la app.**
En **Project Settings › API** copiá la *Project URL* y la *anon public key*.
Después, en la carpeta del proyecto:

```bash
cp .env.example .env
```

y pegá los dos valores adentro de `.env`.

**4. Levantar.**

```bash
npm install
npm run dev
```

Abre en `http://localhost:5180`. La primera vez entrá por **"No tengo cuenta
todavía"**. Después pasá por **Ajustes** y cargá tu fecha de nacimiento, sexo,
altura y peso: sin eso los generadores no pueden calcular nada.

> Si falta el `.env`, la app no rompe: muestra una pantalla con estos mismos pasos.
> (Ojo: sin `.env`, `npm run build` genera un bundle que **solo** contiene esa
> pantalla, porque Vite resuelve la variable en tiempo de compilación y poda el
> resto. Para un build de verdad, el `.env` tiene que estar.)

---

## Cómo está armada

```
src/
  main.jsx              arranque
  app/
    registro.js         ← la lista de módulos. El único archivo que los conoce.
    App.jsx             shell: sesión, ruta, módulo
    Layout.jsx          panel lateral (barra de iconos en celular)
    Hoy.jsx             pantalla de inicio
    rutas.js            router sobre el hash
  core/
    supabase.js         cliente
    auth.jsx            sesión + pantalla de acceso
    perfil.jsx          contexto del perfil: una consulta por sesión
    salud.js            niveles de actividad y objetivos (datos, sin React)
    datos.js            crearStore(): CRUD y huella
    sincronizacion.js   useTabla(): datos, sondeo compartido, cambios optimistas
    fecha.js            fechas locales, semanas, edad en años/meses/días
    formato.js          plata, números
    ui/index.jsx        Modal, Campo, Vacío, Progreso, confirmaciones...
  modulos/
    <nombre>/
      index.js          manifiesto
      datos.js          stores + reglas del dominio
      Pantalla.jsx      pantalla completa
      Resumen.jsx       tarjeta que aporta a Hoy
  estilos/base.css      todos los colores salen de las variables de :root
sql/
  01-esquema.sql        tablas, RLS, triggers
  02-catalogos.sql      ejercicios y alimentos
```

La regla que sostiene todo: **un módulo no importa nada de otro módulo.** Si dos
necesitan lo mismo, eso sube a `core/`.

---

## Agregar un módulo nuevo

1. Creá `src/modulos/<nombre>/` copiando la forma de `tareas/`.
2. Si necesita tablas, agregalas al final de `sql/01-esquema.sql` con el mismo
   molde (`id`, `user_id`, `created_at`, `updated_at`) y cerrá con
   `select public.preparar_tabla('<tabla>');` — esa función prende RLS, crea la
   policy y engancha el trigger de `updated_at`. Si es un catálogo igual para
   todos (sin `user_id`), usá `preparar_catalogo` en su lugar.
3. En `index.js` exportá el manifiesto:

```js
export default {
  id: "libros",          // sale en la URL: #/libros
  nombre: "Libros",
  icono: "▣",
  color: "#7f8fa6",
  Pantalla,
  Resumen,               // opcional: si está, aparece solo en Hoy
  secundario: false,     // true lo manda al pie del menú, con Ajustes
  tablas: ["libros"],
};
```

4. Importalo en `src/app/registro.js` y sumalo al array `MODULOS`.

Listo. El menú, la ruta y la pantalla de Hoy se actualizan solos.

> **Los nombres de clase CSS son globales.** Poneles prefijo del módulo cuando
> sean propios (`agenda-bloque`, no `bloque`). Ya pasó una vez: los bloques de
> la agenda de Rutina eran `.bloque` con `position: absolute`, y cuando Ajustes
> usó ese mismo nombre para sus secciones, la pantalla quedó toda encimada.

---

## El generador de rutinas

Vive en `src/modulos/entrenamiento/`, separado en tres piezas:

- **`deportes.js`** — qué necesita cada deporte del gimnasio: qué patrones
  prioriza, si necesita trabajo explosivo o a una pierna, y qué ejercicios
  preventivos le corresponden. 15 deportes. Es lo único que hay que tocar para
  agregar uno nuevo.
- **`generador.js`** — el motor. No conoce ejercicios: arma el plan por
  **patrones de movimiento** (empujar, traccionar, sentadilla, bisagra de
  cadera, zancada, core) y recién al final elige con qué ejercicio cubrir cada
  uno, según el equipamiento y el nivel.
- **`ejercicios_base`** (en la base) — el catálogo, con `patron`, `equipo`,
  `nivel` y `prioridad`. La prioridad es lo que hace que el ejercicio principal
  del día salga un press de banca y no unas aperturas.

Lo que hace que el plan sea serio y no una lista de ejercicios:

- El reparto de la semana cambia según los días: con 2 días no existe el día de
  brazos, y un principiante con 3 días progresa más repitiendo cuerpo completo
  que partiendo el cuerpo en tres.
- El trabajo explosivo va **primero**, con el sistema nervioso fresco.
- Tope de dos ejercicios pesados por sesión: tres no se recuperan.
- Si para un hueco pesado solo queda un aislado (pasa entrenando en casa), el
  hueco baja a accesorio en vez de programar un face pull a 4×5.
- La prevención se reparte entre los días y es específica: isquios y aductores
  para fútbol, manguito rotador para natación, aquiles para running.
- Cada plan viene con su progresión, su entrada en calor y cuándo descargar.

Cada día del plan se convierte en una sesión con el botón **Entrenar**: crea las
series vacías listas para cargar los pesos.

---

## El generador de dieta

En `src/modulos/dieta/`:

- **`calculadora.js`** — gasto en reposo por Mifflin-St Jeor, por el factor de
  actividad, ajustado por el objetivo. Después reparte los macros en orden:
  proteína por kilo (con tope del 40% de las calorías), grasa con su mínimo
  hormonal, y los carbohidratos se quedan con el resto.
- **`generador.js`** — reparte las calorías entre 3, 4 o 5 comidas y llena cada
  una eligiendo un alimento por rol, con una corrección final de gramos para
  cerrar los macros. En las pruebas cierra con menos de 5% de desvío.
- **`alimentos_base`** (en la base) — 121 alimentos con calorías, proteína,
  carbohidratos, grasa y fibra por cada 100 g, más la porción habitual.

El plan generado se carga al día y desde ahí se edita como cualquier otra
comida. Los macros de cada item se guardan **copiados**: si mañana corregís las
calorías de un alimento, lo que comiste el mes pasado sigue diciendo lo mismo.

Es una estimación, no una medición. El número real se ajusta mirando el peso
durante dos o tres semanas.

---

## Egreso: por qué la app no baja las tablas enteras

El plan gratis de Supabase son 5 GB de egreso por mes. Sondear tablas completas
cada pocos segundos los consume en días — es lo que pasó con Decoglass.

Acá cada tabla se sondea con una **huella**: una consulta que devuelve
`"<cantidad>|<updated_at más nuevo>"` en unos 50 bytes. La cantidad viaja en el
header `Content-Range`, así que lo único que baja es un timestamp. Solo cuando la
huella cambia se baja la tabla de verdad.

Tres detalles que hacen que funcione:

- **`updated_at` lo pone la base**, con un trigger, no el cliente. Si lo pusiera
  el cliente, un celular con la hora atrasada guardaría con fecha vieja, la
  huella no se movería y los demás dispositivos no verían el cambio nunca.
- **Con la pestaña atrás no se sondea nada**, y al volver se revisa enseguida.
- **Cada 50 vueltas (~5 min) se baja igual**, como red de seguridad.

Además solo se sondean las tablas de la pantalla que está abierta, y los módulos
que acumulan historial (entrenamiento, dieta, finanzas) piden ventanas acotadas
en vez de todo: el volumen no crece con los años de uso.

---

## Seguridad

- Cada tabla tiene RLS prendido y una sola policy: `user_id = auth.uid()`.
- El cliente **nunca manda `user_id`**: la columna tiene `DEFAULT auth.uid()`.
  No hay forma de insertar filas a nombre de otro, ni por error ni a propósito.
- Los catálogos (`ejercicios_base`, `alimentos_base`) son de solo lectura para
  todos: `preparar_catalogo` deja una policy `for select` y nada más.
- La `anon key` es pública por diseño. Lo que protege los datos es RLS, no la
  clave — por eso está en `.env` solo para no versionarla, no como secreto.

## Comandos

```bash
npm run dev       # desarrollo en localhost:5180
npm run build     # build de producción en dist/ (necesita .env)
npm run preview   # servir el build para probarlo
```
