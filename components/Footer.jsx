/* Pie de página (se arma en el servidor) */
import Link from 'next/link';
import Logo from './Logo';
import IconoRed from './IconosRedes';
import { REDES, RESENA_GOOGLE, WHATSAPP, telefonoBonito } from '@/lib/config';
import { ORDEN_CATEGORIAS, slugCategoria } from '@/lib/catalogo';

export default function Footer({ fecha, categorias = ORDEN_CATEGORIAS }) {
  // usuario visible: lo que va después de la última / (o del id en Facebook)
  const usuario = (u) => '@' + u.replace(/\/+$/, '').split('/').pop().replace(/^@/, '').replace(/^profile\.php\?id=.*/, 'WolfTech');
  const redes = [
    ['tiktok', 'TikTok', REDES.tiktok],
    ['instagram', 'Instagram', REDES.instagram],
    ['facebook', 'Facebook', REDES.facebook],
  ].filter(([, , u]) => u);
  return (
    <footer className="foot">
      <div className="foot__brand"><Logo />WolfTech</div>
      <section className="redes" aria-label="Redes sociales">
        <p className="redes__t">Síguenos<small>Armados, novedades y precios antes que nadie.</small></p>
        <div className="redes__lista">
          {redes.map(([k, n, u]) => (
            <a key={k} className="redes__a" href={u} target="_blank" rel="noopener" aria-label={`${n} de WolfTech`}>
              <IconoRed red={k} /><span>{n}<small>{usuario(u)}</small></span>
            </a>
          ))}
          <a className="redes__a" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener" aria-label="WhatsApp de WolfTech">
            <IconoRed red="whatsapp" /><span>WhatsApp<small className="num">{telefonoBonito()}</small></span>
          </a>
          {RESENA_GOOGLE && (
            <a className="redes__a" href={RESENA_GOOGLE} target="_blank" rel="noopener" aria-label="Déjanos una reseña en Google">
              <IconoRed red="google" /><span>Google<small>Déjanos tu reseña</small></span>
            </a>
          )}
        </div>
      </section>
      <nav className="foot__cols" aria-label="Más enlaces">
        <div>
          <h2>Categorías</h2>
          <ul>{categorias.map((c) => <li key={c}><Link href={`/categoria/${slugCategoria(c)}`}>{c}</Link></li>)}</ul>
        </div>
        <div>
          <h2>Compra segura</h2>
          <ul>
            <li><Link href="/#como-compras">Cómo compras</Link></li>
            <li><Link href="/nosotros">Quiénes somos</Link></li>
            <li><Link href="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            <li><Link href="/medellin">Entregas en Medellín</Link></li>
            <li><Link href="/envios">Envíos</Link></li>
            <li><Link href="/garantia">Garantía</Link></li>
            <li><Link href="/cambios-y-retracto">Cambios y retracto</Link></li>
            <li><Link href="/privacidad">Tratamiento de datos</Link></li>
          </ul>
        </div>
      </nav>
      <p className="foot__seo">WolfTech es una tienda de componentes y PC gamer en Envigado que atiende Medellín, Itagüí, Sabaneta, Bello y todo el Valle de Aburrá, con envíos a toda Colombia. Vendemos procesadores AMD Ryzen e Intel Core, tarjetas de video NVIDIA RTX, boards, memoria RAM DDR4 y DDR5, discos SSD, fuentes de poder, refrigeración, chasis y portátiles gamer. Cotiza por WhatsApp, arma tu PC con verificación de compatibilidad y recibe cada pieza revisada antes de la entrega.</p>
      <div className="foot__fine">
        <span>Envigado, Antioquia · Precios de contado sujetos a confirmación. Lista actualizada el {fecha}.</span>
        <Link href="/admin" rel="nofollow">Administrar catálogo</Link>
      </div>
      <p className="foot__credito">Página hecha con ☕ por <a href="https://tintostudio.vercel.app/" target="_blank" rel="noopener">Tinto Studio</a></p>
    </footer>
  );
}
