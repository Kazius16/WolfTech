'use client';
/* Barra de navegación (con su propia entrada) */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { useTienda } from './Tienda';

export default function Nav() {
  const { cantidad, abrirCarrito } = useTienda();
  const [scroll, setScroll] = useState(false);
  const ruta = usePathname();
  const enInicio = ruta === '/';

  useEffect(() => {
    const f = () => setScroll(scrollY > (enInicio ? innerHeight * 0.6 : 20));
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, [enInicio]);

  // en el inicio la barra entra con la animación del hero; en las demás páginas aparece de una
  const d = (s) => ({ transitionDelay: enInicio ? s + 's' : '0s' });
  return (
    <header className={'nav' + (scroll ? ' is-scrolled' : '')}>
      <Link className="nav__brand rv" style={d(0.9)} href="/" aria-label="WolfTech, inicio"><Logo /><span>WolfTech</span></Link>
      <nav className="nav__links" aria-label="Secciones">
        <Link className="rv" style={d(1)} href="/#catalogo">Catálogo</Link>
        <Link className="rv" style={d(1.08)} href="/#armador">Arma tu PC</Link>
        <Link className="rv" style={d(1.16)} href="/#como-compras">Cómo compras</Link>
      </nav>
      <button className="nav__cart rv" style={d(1.24)} onClick={() => abrirCarrito(true)} aria-label="Abrir carrito">
        Carrito <b className="num">{cantidad}</b>
      </button>
    </header>
  );
}
