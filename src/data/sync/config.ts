/**
 * Conexión al himnario compartido (Supabase).
 * La clave "publishable" es pública por diseño: solo permite leer; escribir
 * exige iniciar sesión con una cuenta registrada en la tabla admins.
 * Pueden sobrescribirse con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || 'https://qdrxbtymszbszduuxpww.supabase.co';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_E7ZBdj131X_HEABk79jDsQ_P8erv_jw';

export const syncEnabled = () => !!(SUPABASE_URL && SUPABASE_KEY) && import.meta.env.MODE !== 'test';
