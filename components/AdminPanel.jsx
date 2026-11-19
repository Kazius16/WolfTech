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
        <h2>Cobrar con link de pago</h2>
        <p>Cuando ya confirmaste disponibilidad con el proveedor: arma el pedido, crea el link de Bold y mándaselo al cliente por WhatsApp. El cliente paga con tarjeta, PSE o Nequi.</p>
        <form className="addp cobro" id="cobro" autoComplete="off">
          <label>Cliente<input name="cliente" placeholder="Nombre" required /></label>
          <label>Celular<input name="celular" inputMode="tel" placeholder="300 123 4567" /></label>
          <label className="w2">Producto
            <span className="cobro__add">
              <input id="cobroProd" list="dlCobro" placeholder="Escribe: G203, 9800X3D…" />
              <button className="btn btn--ghost btn--sm" type="button" id="cobroAdd">Agregar</button>
            </span>
          </label>
          <datalist id="dlCobro" />
          <ul className="cobro__items" id="cobroItems" />
          <label>Envío / domicilio<input name="envio" inputMode="numeric" placeholder="0" /></label>
          <label className="w2">Nota (opcional)<input name="nota" placeholder="Dirección, color, lo que sea" /></label>
          <p className="addp__prev" id="cobroTotal" />
          <div className="addp__btns"><button className="btn btn--solid btn--sm" type="submit">Crear link de pago</button></div>
        </form>
        <div id="cobroOut" />
        <h3 className="admin__h3">Pedidos recientes</h3>
        <ul className="photos" id="pedList" />

        <h2>Subir lista de precios (PDF)</h2>
        <p>Sube el PDF tal como lo manda el proveedor (J&amp;L o PYPHS). La página lo lee, te muestra qué cambió y tú decides. Los productos nuevos entran ocultos hasta que marques cuáles publicar.</p>
        <label className="drop" id="drop">
          <input type="file" id="pdfIn" accept="application/pdf" multiple />
          <b>Elegir PDF</b><span>o arrástralo aquí</span>
        </label>
        <div id="impOut" />

        <h2>Editar producto</h2>
        <p>Busca cualquier producto. «Editar» abre todos sus datos; «Ocultar» lo quita de la tienda sin borrarlo (lo puedes volver a mostrar); «Borrar» lo elimina de la lista (toca dos veces para confirmar).</p>
        <div className="photos__tools">
          <input id="edQ" type="search" placeholder="Buscar: G203, 9800X3D, Cyborg…" aria-label="Buscar producto para editar" />
          <select id="edF" aria-label="Filtrar por estado" defaultValue="todos">
            <option value="todos">Todos</option><option value="disponible">Disponibles</option><option value="destacado">Destacados</option>
            <option value="transito">En tránsito</option><option value="oculto">Ocultos</option>
          </select>
        </div>
        <form className="addp edp" id="edp" autoComplete="off" hidden>
          <p className="edp__t" id="edpT" />
          <label>Categoría<select name="categoria" required /></label>
          <label>Marca<input name="marca" list="dlMarcas" required /></label>
          <label className="w2">Nombre del producto<input name="nombre" required /></label>
          <label>Costo del proveedor<input name="costo" inputMode="numeric" placeholder="0 = consultar" /></label>
          <label>Estado
            <select name="estado">
              <option value="disponible">Disponible</option>
              <option value="destacado">Destacado</option>
              <option value="transito">En tránsito (consultar)</option>
              <option value="oculto">Oculto</option>
            </select>
          </label>
          <label>Proveedor<input name="proveedor" list="dlProv" /></label>
          <label>Ref. del proveedor<input name="ref" placeholder="Así aparece en el PDF" /></label>
          <label>Precio de venta fijo<input name="venta" inputMode="numeric" placeholder="Vacío = costo + margen" /></label>
          <p className="edp__nota" id="edpFijoNota" hidden>Para poner precio fijo, primero corre <span className="mono">supabase/04-precio-fijo.sql</span> en Supabase.</p>
          <label>Cambiar foto<input name="foto" type="file" accept="image/*" /></label>
          <p className="addp__prev" id="edpPrev" />
          <div className="addp__btns edp__btns">
            <button className="btn btn--solid btn--sm" type="submit">Guardar cambios</button>
            <button className="btn btn--ghost btn--sm" type="button" id="edpNo">Cancelar</button>
            <button className="btn btn--ghost btn--sm edp__del" type="button" id="edpDel">Borrar producto</button>
          </div>
        </form>
        <ul className="photos" id="edList" />

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

        <h3 className="admin__h3">Margen según el costo (escala)</h3>
        <p>Para ganar bien en todo: a lo barato se le pone más % (un mouse de $68.000 aguanta 28 %) y a lo caro menos (un portátil de $4 millones solo aguanta 8–10 %). Aplica a las categorías que <b>no</b> tengan margen propio arriba. El precio fijo de un producto siempre gana.</p>
        <label className="admin__round"><input type="checkbox" id="escOn" /> Usar escala de margen según el costo</label>
        <div className="escala" id="escala" hidden>
          <table>
            <thead><tr><th>Costo del proveedor hasta</th><th>Margen</th><th>Ejemplo real</th></tr></thead>
            <tbody id="escRows" />
          </table>
          <label className="escala__min">Ganancia mínima por producto<input id="escMin" inputMode="numeric" placeholder="10000" /></label>
          <p className="escala__ayuda">La ganancia mínima no aplica a productos de menos de $20.000 de costo (rollos, etiquetas, cables).</p>
          <p className="edp__nota" id="escNota" />
          <button className="btn btn--ghost btn--sm" type="button" id="escReset">Usar la escala sugerida</button>
        </div>

        <h2>Lista de productos</h2>
        <p>Una línea por producto: <span className="mono">categoría;marca;nombre;costo;estado;proveedor;ref;venta</span>. Costo en pesos sin puntos (0 = «Consultar»). «venta» es opcional: si la pones, ese es el precio al público y se ignora el margen. Estados: disponible, transito, destacado u oculto. La última columna (ref) es como aparece el producto en el PDF del proveedor: no la cambies, con ella se cruzan las listas nuevas.</p>
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
