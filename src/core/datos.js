import { supabase } from "./supabase.js";

/**
 * Capa de datos. Todo módulo habla con la base a través de un store creado acá,
 * nunca llamando a supabase directo. Eso permite cambiar de backend más adelante
 * tocando un solo archivo.
 *
 * `user_id` NO se manda desde el cliente: la columna tiene DEFAULT auth.uid() y
 * las policies de RLS filtran por auth.uid(). Un cliente no puede escribir filas
 * ajenas ni aunque quiera.
 */

export function crearStore(tabla, { orden = "created_at", asc = false } = {}) {
  return {
    tabla,

    async listar({ filtros = {}, limite } = {}) {
      let q = supabase.from(tabla).select("*");
      for (const [col, val] of Object.entries(filtros)) {
        if (val === undefined || val === null) continue;
        if (Array.isArray(val)) q = q.in(col, val);
        else if (typeof val === "object" && val.op) q = q[val.op](col, val.valor);
        else q = q.eq(col, val);
      }
      q = q.order(orden, { ascending: asc, nullsFirst: false });
      if (limite) q = q.limit(limite);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async crear(fila) {
      const { data, error } = await supabase.from(tabla).insert(fila).select().single();
      if (error) throw error;
      return data;
    },

    async crearVarias(filas) {
      if (!filas.length) return [];
      const { data, error } = await supabase.from(tabla).insert(filas).select();
      if (error) throw error;
      return data ?? [];
    },

    async actualizar(id, cambios) {
      const { data, error } = await supabase
        .from(tabla).update(cambios).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },

    async borrar(id) {
      const { error } = await supabase.from(tabla).delete().eq("id", id);
      if (error) throw error;
    },

    /**
     * Huella: "<cantidad>|<updated_at más nuevo>" en ~50 bytes.
     * La cantidad viaja en el header Content-Range, no en el cuerpo, así que
     * el único dato que baja es un timestamp. Sirve para saber si hace falta
     * bajar la tabla entera sin bajarla.
     *
     * Cubre los tres casos: alta y baja mueven la cantidad, edición mueve el
     * updated_at (que lo pone la BASE con un trigger, no el cliente — si lo
     * pusiera el cliente, un dispositivo con la hora atrasada dejaría la huella
     * quieta y los cambios nunca se verían en los demás).
     */
    async huella() {
      const { data, count, error } = await supabase
        .from(tabla)
        .select("updated_at", { count: "exact" })
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1);
      if (error) throw error;
      return `${count ?? 0}|${data?.[0]?.updated_at ?? ""}`;
    },
  };
}
