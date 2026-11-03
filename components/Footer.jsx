/* Pie de página (se arma en el servidor) */
import Link from 'next/link';
import Logo from './Logo';
import { REDES, WHATSAPP, telefonoBonito } from '@/lib/config';
import { ORDEN_CATEGORIAS, slugCategoria } from '@/lib/catalogo';

export default function Footer({ fecha, categorias = ORDEN_CATEGORIAS }) {
  const redes = [['Instagram', REDES.instagram], ['TikTok', REDES.tiktok], ['Facebook', REDES.facebook]].filter(([, u]) => u);
  return (
    <footer className="foot">
      <div className="foot__brand"><Logo />WolfTech</div>
      <div className="foot__links">
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener">WhatsApp <span className="num">{telefonoBonito()}</span></a>
        {redes.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener">{n}</a>)}
      </div>
      <nav className="foot__cols" aria-label="Más enlaces">
        <div>
          <h2>Categorías</h2>
          <ul>{categorias.map((c) => <li key={c}><Link href={`/categoria/${slugCategoria(c)}`}>{c}</Link></li>)}</ul>
        </div>
        <div>
          <h2>Compra segura</h2>
          <ul>
            <li><Link href="/#como-compras">Cómo compras</Link></li>
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
    </footer>
  );
}
