'use client';
/* Remisiones (/admin/remision). La lógica vive en lib/remision.js */
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { montarRemision, PAGOS } from '@/lib/remision';
import { useTienda } from './Tienda';

export default function Remision() {
  const root = useRef(null);
  const { toast } = useTienda();

  useEffect(() => {
    document.body.classList.add('is-admin');
    const desmontar = montarRemision(root.current, { toast });
    return () => { desmontar(); document.body.classList.remove('is-admin'); };
  }, [toast]);

  return (
    <section className="admin rem is-locked" ref={root} aria-labelledby="remTitle">
      <h1 id="remTitle">Remisión</h1>
      <p className="admin__lead">Constancia de lo que le entregas al cliente: productos, serial, garantía y firma de recibido. Se guarda para buscarla después por cliente o serial.</p>
      <div className="admin__top">
        <Link className="btn btn--ghost btn--sm" href="/admin">Volver al admin</Link>
      </div>
      <p className="rem__lock">Primero <Link href="/admin">entra al admin</Link> con tu cuenta y vuelve a esta página.</p>
      <Logo className="rem__logo" />

      <div className="admin__body">
        <form className="addp rem__form" id="rem" autoComplete="off">
          <label>Fecha<input type="date" name="fecha" required /></label>
          <label>Forma de pago
            <select name="pago" defaultValue={PAGOS[0]}>{PAGOS.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label>Cliente<input name="cliente" placeholder="Nombre completo" required /></label>
          <label>C.C. / NIT<input name="documento" placeholder="C.C. 1.000.000.000" /></label>
          <label>Celular<input name="celular" inputMode="tel" placeholder="300 123 4567" /></label>
          <label>Ciudad<input name="ciudad" placeholder="Envigado" /></label>
          <label className="w2">Dirección<input name="direccion" placeholder="Calle, número, apto (si se envía)" /></label>

          <label className="w2">Producto
            <span className="cobro__add">
              <input id="remProd" list="dlRem" placeholder="Escribe: portátil, RTX 5060, G203…" />
              <button className="btn btn--ghost btn--sm" type="button" id="remAdd">Agregar</button>
            </span>
          </label>
          <datalist id="dlRem" />
          <datalist id="dlGar"><option value="12 meses" /><option value="6 meses" /><option value="3 meses" /><option value="24 meses" /><option value="36 meses" /><option value="Sin garantía" /></datalist>
          <ul className="rem__items" id="remItems" />
          <p className="w2"><button className="btn btn--ghost btn--sm" type="button" id="remMano">+ Línea a mano</button></p>

          <label>Envío / domicilio<input name="envio" inputMode="numeric" placeholder="0" /></label>
          <label>Nota (opcional)<input name="nota" placeholder="Color, estado, lo que sea" /></label>
          <p className="addp__prev" id="remTotal" />
          <div className="addp__btns"><button className="btn btn--solid btn--sm" type="submit">Guardar y ver remisión</button></div>
        </form>

        <div className="rem__vista" id="remVista" hidden>
          <div className="rem__acc">
            <button className="btn btn--solid btn--sm" type="button" id="remPdf">Descargar PDF</button>
            <button className="btn btn--ghost btn--sm" type="button" id="remWa">Enviar por WhatsApp</button>
            <button className="btn btn--ghost btn--sm" type="button" id="remCopiar">Copiar mensaje</button>
            <button className="btn btn--ghost btn--sm edp__del" type="button" id="remAnular">Anular</button>
            <button className="btn btn--ghost btn--sm" type="button" id="remCerrar">Cerrar</button>
          </div>
          <p className="rem__ayuda">En el celular: «Descargar PDF» → Guardar como PDF. Luego «Enviar por WhatsApp» abre el chat con el mensaje listo y adjuntas el PDF.</p>
          <div id="remDoc" />
        </div>

        <h3 className="admin__h3">Remisiones</h3>
        <label className="rem__buscar">Buscar por cliente, número o serial<input id="remBuscar" placeholder="Ej.: Tatiana, REM-0003, 5CD1234" /></label>
        <ul className="photos" id="remList" />
      </div>
    </section>
  );
}
