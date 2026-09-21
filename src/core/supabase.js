import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Falta configurar el .env: la app lo detecta y muestra instrucciones en vez de romperse. */
export const sinConfigurar = !url || !anon;

export const supabase = sinConfigurar
  ? null
  : createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
