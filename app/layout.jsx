import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SITIO } from '@/lib/config';
import { obtenerCatalogo } from '@/lib/datos';
import Tienda from '@/components/Tienda';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Arranque from '@/components/Arranque';

const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: 'WolfTech | Componentes y PC gamer en Medellín y Envigado',
    template: '%s | WolfTech',
  },
  description: 'Tienda de hardware de PC en Envigado y Medellín: procesadores Ryzen e Intel, tarjetas de video RTX, boards, RAM, SSD, fuentes y portátiles gamer. Arma tu PC compatible y cotiza por WhatsApp. Envíos a toda Colombia.',
  applicationName: 'WolfTech',
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website', locale: 'es_CO', siteName: 'WolfTech',
    title: 'WolfTech | Componentes y PC gamer en Medellín',
    description: 'Procesadores, tarjetas de video, boards y portátiles gamer. Cada pieza revisada antes de la entrega. Cotiza por WhatsApp.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'WolfTech' }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const { productos, fecha } = await obtenerCatalogo();
  return (
    <html lang="es-CO" className={mono.variable}>
      <head>
        <noscript>
          <style>{'.curtain,[data-reveal="title"],.wipe,.nav .rv{clip-path:none!important;filter:none!important;opacity:1!important}.ch{opacity:1!important;filter:none!important;transform:none!important}'}</style>
        </noscript>
      </head>
      <body>
        <Tienda productos={productos} fecha={fecha}>
          <Nav />
          {children}
          <Footer fecha={fecha} />
          <Arranque />
        </Tienda>
      </body>
    </html>
  );
}
