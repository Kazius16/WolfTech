import Link from 'next/link';

export const metadata = { title: 'Página no encontrada', robots: { index: false } };

export default function NoEncontrado() {
  return (
    <main className="nf">
      <h1>Esta página no existe.</h1>
      <p>Puede que el producto ya no esté publicado o que el enlace esté mal escrito. Mira el catálogo o escríbenos y lo buscamos con el proveedor.</p>
      <div>
        <Link className="btn btn--solid" href="/#catalogo">Ver catálogo</Link>
        <Link className="btn btn--ghost" href="/">Ir al inicio</Link>
      </div>
    </main>
  );
}
