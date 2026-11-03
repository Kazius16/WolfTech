/* Utilidades pequeñas que se usan en todo lado */

export const sinTildes = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
export const slug = (s) => sinTildes(String(s).toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const pesos = (n) => '$' + Math.round(n).toLocaleString('es-CO');

/* localStorage seguro (puede fallar en modo privado) */
export const store = {
  get(k, d) {
    try { const v = localStorage.getItem('wt:' + k); return v ? JSON.parse(v) : d; } catch { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('wt:' + k, JSON.stringify(v)); return true; } catch { return false; }
  },
};
