# WolfTech — tienda de componentes y PC gamer

Tienda en **Next.js** con el catálogo en **Supabase**. Se publica en **Vercel** (wolftech.com.co).

## Qué hay en cada carpeta

| Ruta | Qué es |
|---|---|
| `app/` | Las páginas. Cada carpeta es una dirección: `app/garantia` → `/garantia`. |
| `app/producto/[id]` | Una página por producto: `/producto/msi-rtx-5070-12gb-gaming-trio-oc-3-fan`. |
| `app/categoria/[slug]` | Una página por categoría: `/categoria/tarjetas-de-video`. |
| `app/admin` | Panel del administrador (subir PDF, fotos, márgenes, lista). |
| `app/sitemap.js`, `app/robots.js` | Mapa del sitio para Google (se arma solo). |
| `app/api/revalidar` | Cuando el admin guarda, actualiza la tienda de una vez. |
| `components/` | Piezas de la página: hero, catálogo, tarjeta, armador, carrito… |
| `lib/config.js` | **Lo que más vas a cambiar**: WhatsApp, datos legales, redes. |
| `lib/catalogo.js` | Reglas del catálogo: compatibilidad, precios con margen, nombres. |
| `lib/datos.js` | Lee el catálogo de Supabase (con copia de respaldo). |
| `lib/admin.js` | Lógica del panel del administrador. |
| `lib/lectores.js` | Lectores de los PDF de J&L y PYPHS. |
| `data/catalogo.txt` | Copia de respaldo del catálogo (formato `categoria;marca;nombre;costo;estado;proveedor;ref`). |

## Cambios comunes

- **Número de WhatsApp:** `lib/config.js` → `WHATSAPP` (con 57, sin espacios).
- **Titular legal:** `lib/config.js` → `TIENDA.titular` y `TIENDA.documento`.
- **Redes sociales:** `lib/config.js` → `REDES`.
- **Precios, productos, fotos y márgenes:** desde `/admin`, no desde el código.

## Probar en tu computador

```bash
npm install
npm run dev      # abre http://localhost:3000
```

## Seguridad

- En el código solo va la llave **publicable** de Supabase (`sb_publishable_…`). Es pública por diseño; lo que protege los datos son las reglas RLS de la base de datos.
- **Nunca** pongas la llave secreta (`sb_secret_…`) en el código ni en Vercel.
- Los administradores se agregan solo desde el SQL Editor de Supabase (tabla `admins`).
