/** Se muestra cuando falta el .env, en vez de dejar la app colgada o romper
 *  con un error de consola que no dice nada. */
export function FaltaConfigurar() {
  return (
    <div className="pantalla-centro">
      <div className="config-caja">
        <h1>Falta conectar la base</h1>
        <p>Rumbo todavía no sabe a qué proyecto de Supabase conectarse.</p>
        <ol>
          <li>Creá un proyecto en <code>supabase.com</code>.</li>
          <li>Entrá a <strong>Project Settings › API</strong> y copiá la <em>Project URL</em> y la <em>anon public key</em>.</li>
          <li>En la carpeta del proyecto, copiá <code>.env.example</code> como <code>.env</code> y pegá esos dos valores.</li>
          <li>Corré el SQL de <code>sql/01-esquema.sql</code> en el <strong>SQL Editor</strong> de Supabase.</li>
          <li>Reiniciá <code>npm run dev</code>.</li>
        </ol>
      </div>
    </div>
  );
}
