'use client';
/* Panel del administrador (/admin). La lógica vive en lib/admin.js */
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { montarAdmin } from '@/lib/admin';
import { useTienda } from './Tienda';

export default function AdminPanel() {
  const root = useRef(null);
  const { toast } = useTienda();

  useEffect(() => {
    document.body.classList.add('is-admin');
    const desmontar = montarAdmin(root.current, { toast });
    return () => { desmontar(); document.body.classList.remove('is-admin'); };
  }, [toast]);

  return (
    <section className="admin is-locked" ref={root} aria-labelledby="adminTitle">
      <h1 id="adminTitle">Administrar catálogo</h1>
      <p className="admin__lead">Aquí se cambian precios, márgenes, qué productos se ven y sus fotos.</p>
      <p className="admin__warn">Los cambios que guardes aquí se publican de una vez para todos los clientes.</p>
      <div className="admin__top">
        <Link className="btn btn--ghost btn--sm" href="/">Volver a la tienda</Link>
        <button className="btn btn--ghost btn--sm" id="logout" hidden>Cerrar sesión</button>
      </div>

      <form className="login" id="login" hidden>
        <h2>Entrar</h2>
        <p>Solo para administradores de WolfTech.</p>
        <label>Correo<input type="email" name="email" required autoComplete="username" /></label>
        <label>Contraseña<input type="password" name="pass" required autoComplete="current-password" /></label>
        <button className="btn btn--solid btn--sm" type="submit">Entrar</button>
        <p className="login__err" id="loginErr" role="alert" />
      </form>

      <div className="admin__body">
        <h2>Subir lista de precios (PDF)</h2>
        <p>Sube el PDF tal como lo manda el proveedor (J&amp;L o PYPHS). La página lo lee, te muestra qué cambió y tú decides. Los productos nuevos entran ocultos hasta que marques cuáles publicar.</p>
        <label className="drop" id="drop">
          <input type="file" id="pdfIn" accept="application/pdf" multiple />
          <b>Elegir PDF</b><span>o arrástralo aquí</span>
        </label>
        <div id="impOut" />

        <h2>Agregar producto</h2>
        <p>Para productos que no vienen en los PDF o que quieres montar ya. Quedan en la lista igual que los demás.</p>
        <form className="addp" id="addp" autoComplete="off">
          <label>Categoría<select name="categoria" required /></label>
          <label>Marca<input name="marca" list="dlMarcas" required placeholder="ASUS, MSI, Redragon…" /></label>
          <label className="w2">Nombre del producto<input name="nombre" required placeholder="RTX 5060 8GB Dual OC" /></label>
          <label>Costo del proveedor<input name="costo" inputMode="numeric" placeholder="0 = consultar" /></label>
          <label>Estado
            <select name="estado" defaultValue="disponible">
              <option value="disponible">Disponible</option>
              <option value="destacado">Destacado</option>
              <option value="transito">En tránsito (consultar)</option>
              <option value="oculto">Oculto</option>
            </select>
          </label>
          <label>Proveedor<input name="proveedor" list="dlProv" placeholder="J&amp;L, PYPHS u otro" /></label>
          <label>Foto (opcional)<input name="foto" type="file" accept="image/*" /></label>
          <p className="addp__prev" id="addpPrev" />
          <div className="addp__btns"><button className="btn btn--solid btn--sm" type="submit">Agregar producto</button></div>
          <datalist id="dlMarcas" />
          <datalist id="dlProv"><option value="J&amp;L" /><option value="PYPHS" /></datalist>
        </form>

        <h2>Fotos de productos</h2>
        <p>Busca el producto y toca «Subir foto». Lo ideal es la foto oficial de la marca en PNG sin fondo. La página la reduce sola; no tienes que editarla.</p>
        <div className="photos__tools">
          <input id="phQ" type="search" placeholder="Buscar producto…" aria-label="Buscar producto para foto" />
          <select id="phF" aria-label="Filtrar" defaultValue="todos">
            <option value="todos">Todos</option><option value="sin">Sin foto</option><option value="con">Con foto</option>
          </select>
        </div>
        <ul className="photos" id="photos" />
        <p className="photos__use" id="phUse" />

        <h2>Margen por categoría</h2>
        <p>Si una categoría queda vacía, usa el margen base.</p>
        <div className="margins" id="margins" />
        <label className="admin__round"><input type="checkbox" id="round" /> Redondear precios a …900 (ej. 862.500 → 869.900)</label>

        <h2>Lista de productos</h2>
        <p>Una línea por producto: <span className="mono">categoría;marca;nombre;costo;estado;proveedor;ref</span>. Costo en pesos sin puntos (0 = «Consultar»). Estados: disponible, transito, destacado u oculto. La última columna (ref) es como aparece el producto en el PDF del proveedor: no la cambies, con ella se cruzan las listas nuevas.</p>
        <textarea id="adminList" spellCheck="false" aria-label="Lista de productos" />
        <div className="admin__btns">
          <button className="btn btn--ghost btn--sm" id="aDiff">Revisar cambios</button>
          <button className="btn btn--solid btn--sm" id="aSave">Guardar y publicar</button>
          <button className="btn btn--ghost btn--sm" id="aCopy">Copiar lista</button>
        </div>
        <div className="stats" id="aStats" />
        <ul className="errors" id="aErr" />
        <div className="diff" id="aDiffOut" hidden>
          <section><h3 id="dNewT">Nuevos</h3><ul id="dNew" /></section>
          <section><h3 id="dGoneT">Ya no están</h3><ul id="dGone" /></section>
          <section><h3 id="dPriceT">Cambian de precio</h3><ul id="dPrice" /></section>
        </div>
      </div>
    </section>
  );
}
