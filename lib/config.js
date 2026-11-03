/* ============================================================
   CONFIGURACIÓN DE LA TIENDA — lo que más vas a cambiar
   ============================================================ */

// Número de WhatsApp de la tienda, con indicativo 57 y sin espacios
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '573053782400';

// Dirección pública del sitio (sin / al final)
export const SITIO = 'https://www.wolftech.com.co';

// Supabase: la llave publicable es pública por diseño (la seguridad la dan las reglas RLS).
// NUNCA pongas aquí la llave secreta (sb_secret_…).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dprucbhidjusmxrmhcqw.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_ZoN9i_fOL0MHeopipmaPDA_WSHZWTdZ';

// Valores por defecto si Supabase no trae ajustes
export const AJUSTES_BASE = {
  margenBase: 15,          // % por defecto
  margenes: {},            // % por categoría, ej. {'Tarjetas de video': 10}
  redondeo: true,          // precios terminados en …900
  fecha: '27 de octubre de 2026',
};

// Cada cuánto (segundos) se refresca el catálogo desde Supabase si nadie guarda nada.
// Cuando el administrador guarda, las páginas se actualizan de una vez.
export const REFRESCO = 300;

// Datos del responsable para las páginas legales.
// Llena "titular" y "documento" con quien vaya a ser el responsable (persona natural o empresa).
export const TIENDA = {
  marca: 'WolfTech',
  titular: 'Juan Camilo Quintero Vasco',
  documento: 'C.C. 1.109.195.413',     // cuando haya empresa: 'NIT …'
  direccion: 'Carrera 40A # 44 Sur 49',
  ciudad: 'Envigado, Antioquia',
  correo: 'empwolftech@gmail.com',
  vigenciaPoliticas: '3 de noviembre de 2026',
};

// Redes sociales: deja vacío lo que no tengas (no se muestra)
export const REDES = {
  instagram: 'https://www.instagram.com/wolf_tech1/',
  tiktok: 'https://www.tiktok.com/@wolf_tech1',
  facebook: '',
};

export const telefonoBonito = () => WHATSAPP.replace(/^57/, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
export const telefonoIntl = () => '+57 ' + telefonoBonito();
