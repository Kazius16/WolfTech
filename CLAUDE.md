# WolfTech

Tienda online de componentes y PC gamer (Envigado, Colombia), wolftech.com.co. Next.js + Supabase. Responde siempre en español, directo y honesto: si algo no se puede verificar o hacer, dilo.

## El negocio
- Vendemos procesadores, tarjetas de video, boards, RAM, SSD, fuentes, refrigeración, chasis y portátiles gamer. No celulares.
- Sin inventario: el cliente cotiza por WhatsApp o la web → confirmamos disponibilidad y precio con el proveedor → paga → recogemos y revisamos la pieza (sello, serial, accesorios) → se entrega o envía. Factura a nombre de WolfTech.
- Precios = costo del proveedor + margen (empieza en 15 %). Productos «en tránsito» muestran «Consultar».
- Reglas de compatibilidad y datos técnicos: `lib/catalogo.js` (REGLAS) y `components/Armador.jsx` (consumo/fuente). Cualquier dato técnico en contenido tiene que coincidir con esto.

## Marca
- Negro, blanco y azul neón #2E8CFF (el azul es acento, poco). Tipografía Inter / Inter Display.
- Logo: `marketing/videos/logo.svg`, exacto. Nunca redibujarlo.
- Que no parezca hecho por IA: nada de degradados morados, cuadrículas de tarjetas idénticas, emojis como íconos ni efectos de vidrio genéricos.
- Nunca: precios sin confirmar ese día, FPS sin fuente, reseñas o comentarios inventados, promesas que no estén en la página de garantía.

## Marketing
- `marketing/videos/`: videos animados (HTML con `render(t)` → Playwright → FFmpeg). Ver su LEEME.
- `marketing/editor/`: editor de tomas grabadas con el celular. Comando: `/editar-video <carpeta>`.
- Videos verticales 1080×1920 a 30 fps; texto importante entre y=230 y y=1620; siempre cierre con el lobo, wolftech.com.co y «Cotiza por WhatsApp».
- Las tomas crudas no van a git (pesan mucho): se guardan fuera del repo o en una carpeta ignorada.

## Código
- Claro y modular: lo mantienen Milo y otros agentes (OpenCode). Comentarios en español.
- El catálogo es una sola lista editable `categoría;marca;nombre;costo;estado`.
- Tiene que verse bien en celular: la mayoría de clientes vienen de redes.
