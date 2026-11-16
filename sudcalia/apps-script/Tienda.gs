/**
 * SUDCALIA EDICIONES · Tienda con entrega automática
 *
 * Cómo funciona:
 *   1. El lector pone su correo en la ficha del libro y pulsa "Comprar".
 *   2. Este script registra el pedido en la pestaña "Pedidos", crea el pago en
 *      Mercado Pago y lo manda a pagar (tarjeta, OXXO, transferencia…).
 *   3. Cuando Mercado Pago aprueba el pago, el script lo comprueba DIRECTAMENTE
 *      con Mercado Pago (nunca confía en lo que diga el navegador) y envía el PDF
 *      por correo. Lo comprueba por tres vías, por si alguna falla:
 *        a) al volver el lector a gracias.html,
 *        b) por el aviso (webhook) que manda Mercado Pago,
 *        c) por una revisión automática cada 10 minutos (pagos en OXXO, etc.).
 *      Cada pedido se entrega una sola vez.
 *
 * Instalación (una sola vez):
 *   1. Sube a tu Google Drive los PDF de los libros II, III y IV. NO los
 *      compartas: el script los lee como dueño. Copia el ID de cada uno (la parte
 *      de la URL entre /d/ y /view) y pégalo abajo en LIBROS_VENTA.
 *   2. En Mercado Pago: Tu negocio → Configuración → Credenciales → Credenciales
 *      de producción. Copia el "Access Token" (empieza con APP_USR-).
 *      Para probar sin cobrar, usa el de prueba (empieza con TEST-).
 *   3. En Apps Script: ⚙ Configuración del proyecto → Propiedades del script →
 *      Agregar propiedad:  MP_ACCESS_TOKEN  =  (tu Access Token)
 *      El token NUNCA se escribe en el código ni en el sitio.
 *   4. Ejecuta una vez la función `instalarTienda` y autoriza los permisos
 *      (Drive, correo, conexiones externas).
 *   5. Implementar → Gestionar implementaciones → editar → Versión nueva.
 *
 * Para reenviar un libro a alguien: menú "Sudcalia" de la hoja → Reenviar pedido.
 */

// ── Ajustes de la tienda ────────────────────────────────
const TIENDA = {
  SITIO: 'https://rhinobuild.github.io/sudcalia/',
  HOJA_PEDIDOS: 'Pedidos',
  REMITENTE: 'Sudcalia Ediciones',
  RESPONDER_A: 'contacto@rhinobuild.org',
  AVISAR_VENTA_A: 'contacto@rhinobuild.org',   // '' para no recibir aviso de cada venta
  MONEDA: 'MXN',
  DIAS_PARA_REVISAR: 7                         // pedidos pendientes que se siguen revisando
};

// Precios y archivos. El precio SIEMPRE sale de aquí, no del sitio.
const LIBROS_VENTA = {
  'libro-2': { titulo: 'La última hoja', numero: 'II', precio: 99, pdf: 'PEGA_AQUI_EL_ID_DEL_PDF_DEL_LIBRO_2' },
  'libro-3': { titulo: 'Lo que duerme bajo la raíz', numero: 'III', precio: 99, pdf: 'PEGA_AQUI_EL_ID_DEL_PDF_DEL_LIBRO_3' },
  'libro-4': { titulo: 'Donde la lluvia recuerda', numero: 'IV', precio: 99, pdf: 'PEGA_AQUI_EL_ID_DEL_PDF_DEL_LIBRO_4' }
};

const COLS_PEDIDOS = ['Fecha', 'Pedido', 'Libro', 'Título', 'Precio', 'Correo', 'Nombre', 'Estado', 'Pago MP', 'Entregado', 'Notas'];
const C = { FECHA: 1, PEDIDO: 2, LIBRO: 3, TITULO: 4, PRECIO: 5, CORREO: 6, NOMBRE: 7, ESTADO: 8, PAGO: 9, ENTREGADO: 10, NOTAS: 11 };

// ── Instalación ─────────────────────────────────────────
function instalarTienda() {
  const hoja = hojaPedidos_();
  // Revisión automática cada 10 minutos
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'revisarPendientes')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('revisarPendientes').timeBased().everyMinutes(10).create();
  // Comprobaciones
  const avisos = [];
  if (!PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN')) avisos.push('Falta la propiedad MP_ACCESS_TOKEN.');
  Object.keys(LIBROS_VENTA).forEach(id => {
    try { DriveApp.getFileById(LIBROS_VENTA[id].pdf).getName(); }
    catch (e) { avisos.push('No encuentro el PDF de ' + id + ' en Drive.'); }
  });
  const msg = avisos.length ? 'Tienda instalada con pendientes:\n- ' + avisos.join('\n- ') : 'Tienda instalada y lista.';
  console.log(msg);
  return msg;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sudcalia')
    .addItem('Reenviar pedido…', 'menuReenviar')
    .addItem('Revisar pagos pendientes ahora', 'revisarPendientes')
    .addToUi();
}

function menuReenviar() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Reenviar pedido', 'Escribe el número de pedido (columna "Pedido"):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const fila = buscarPedido_(r.getResponseText().trim());
  if (!fila) return ui.alert('No encontré ese pedido.');
  const hoja = hojaPedidos_();
  const estado = hoja.getRange(fila, C.ESTADO).getValue();
  if (estado !== 'Entregado' && estado !== 'Pagado') return ui.alert('Ese pedido no está pagado (estado: ' + estado + ').');
  entregar_(fila, true);
  ui.alert('Libro reenviado a ' + hoja.getRange(fila, C.CORREO).getValue());
}

// ── 1) Crear el pago ────────────────────────────────────
function tiendaPagar(p) {
  try {
    const libro = LIBROS_VENTA[p.libro];
    const correo = String(p.correo || '').trim().toLowerCase().slice(0, 160);
    const nombre = limpiar(p.nombre, 120);
    if (!libro) return responder({ ok: false, error: 'libro' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return responder({ ok: false, error: 'correo' });
    if (p.acepto !== 'si') return responder({ ok: false, error: 'aviso' });

    // Anti-abuso: máximo 5 intentos por correo cada hora
    const cache = CacheService.getScriptCache();
    const k = 'p_' + Utilities.base64EncodeWebSafe(correo).slice(0, 200);
    const n = Number(cache.get(k) || 0);
    if (n >= 5) return responder({ ok: false, error: 'limite' });
    cache.put(k, String(n + 1), 3600);

    const pedido = 'SUD-' + Utilities.formatDate(new Date(), 'America/Mazatlan', 'yyMMdd') + '-' +
      Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
    const urlScript = ScriptApp.getService().getUrl();
    const gracias = TIENDA.SITIO + 'gracias.html?pedido=' + encodeURIComponent(pedido);

    const pref = mp_('post', '/checkout/preferences', {
      items: [{
        id: p.libro,
        title: libro.titulo + ' · La Saga de los Robles Eternos (Libro ' + libro.numero + ') · PDF',
        quantity: 1,
        unit_price: libro.precio,
        currency_id: TIENDA.MONEDA
      }],
      payer: { email: correo, name: nombre || undefined },
      external_reference: pedido,
      back_urls: { success: gracias, pending: gracias, failure: gracias },
      auto_return: 'approved',
      notification_url: urlScript + '?accion=webhook',
      statement_descriptor: 'SUDCALIA',
      metadata: { pedido: pedido, libro: p.libro }
    });

    hojaPedidos_().appendRow([new Date(), pedido, p.libro, libro.titulo, libro.precio, correo, nombre, 'Pendiente', '', '', '']);
    return responder({ ok: true, pedido: pedido, url: pref.init_point });
  } catch (err) {
    console.error(err);
    return responder({ ok: false, error: 'servidor' });
  }
}

// ── 2a) El lector vuelve a gracias.html ─────────────────
function tiendaConfirmar(p) {
  const fila = buscarPedido_(String(p.pedido || ''));
  if (!fila) return responder({ ok: false, error: 'pedido' });
  const hoja = hojaPedidos_();
  let estado = hoja.getRange(fila, C.ESTADO).getValue();
  if (estado === 'Pendiente') {
    // Busca el pago real en Mercado Pago (ignora lo que diga la URL)
    const pago = buscarPagoAprobado_(hoja.getRange(fila, C.PEDIDO).getValue(), p.payment_id);
    if (pago) { procesarPago_(pago); estado = hoja.getRange(fila, C.ESTADO).getValue(); }
    else if (p.payment_id) {
      const pg = leerPago_(p.payment_id);
      if (pg && pg.external_reference === hoja.getRange(fila, C.PEDIDO).getValue() &&
          (pg.status === 'rejected' || pg.status === 'cancelled')) estado = 'Rechazado';
      else if (pg && (pg.status === 'pending' || pg.status === 'in_process')) estado = 'En espera';
    }
  }
  return responder({
    ok: true,
    estado: estado,                         // Pendiente | En espera | Rechazado | Pagado | Entregado | Error
    titulo: hoja.getRange(fila, C.TITULO).getValue(),
    correo: ocultarCorreo_(hoja.getRange(fila, C.CORREO).getValue())
  });
}

// ── 2b) Aviso de Mercado Pago (webhook) ─────────────────
function tiendaWebhook(e) {
  try {
    const p = (e && e.parameter) || {};
    let id = p['data.id'] || (p.topic === 'payment' ? p.id : '');
    let tipo = p.type || p.topic || '';
    if (e && e.postData && e.postData.contents) {
      try {
        const b = JSON.parse(e.postData.contents);
        tipo = b.type || b.topic || tipo;
        id = (b.data && b.data.id) || id;
      } catch (_) {}
    }
    if (String(tipo).indexOf('payment') === 0 && id) {
      const pago = leerPago_(id);
      if (pago && pago.status === 'approved') procesarPago_(pago);
    }
  } catch (err) { console.error(err); }
  return ContentService.createTextOutput('ok');
}

// ── 2c) Revisión automática (trigger cada 10 min) ───────
function revisarPendientes() {
  const hoja = hojaPedidos_();
  const datos = hoja.getDataRange().getValues();
  const limite = Date.now() - TIENDA.DIAS_PARA_REVISAR * 864e5;
  for (let i = 1; i < datos.length; i++) {
    const estado = datos[i][C.ESTADO - 1];
    const fecha = new Date(datos[i][C.FECHA - 1]).getTime();
    if ((estado === 'Pendiente' && fecha > limite) || estado === 'Pagado') {
      try {
        if (estado === 'Pagado') { reintentarEnvio_(i + 1); continue; }  // reintento de envío
        const pago = buscarPagoAprobado_(datos[i][C.PEDIDO - 1]);
        if (pago) procesarPago_(pago);
      } catch (err) { console.error(err); }
    }
  }
}

// ── Lógica común ────────────────────────────────────────
function procesarPago_(pago) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const fila = buscarPedido_(pago.external_reference);
    if (!fila) return;
    const hoja = hojaPedidos_();
    const estado = hoja.getRange(fila, C.ESTADO).getValue();
    if (estado === 'Entregado') return;                               // nunca dos veces
    const precio = Number(hoja.getRange(fila, C.PRECIO).getValue());
    const ok = pago.status === 'approved' &&
      pago.currency_id === TIENDA.MONEDA &&
      Number(pago.transaction_amount) >= precio;
    if (!ok) {
      hoja.getRange(fila, C.NOTAS).setValue('Pago ' + pago.id + ' no válido: ' + pago.status + ' ' + pago.transaction_amount + ' ' + pago.currency_id);
      return;
    }
    hoja.getRange(fila, C.ESTADO).setValue('Pagado');
    hoja.getRange(fila, C.PAGO).setValue(String(pago.id));
    entregar_(fila, false);
  } finally {
    lock.releaseLock();
  }
}

function entregar_(fila, reenvio) {
  const hoja = hojaPedidos_();
  const [fecha, pedido, idLibro, titulo, precio, correo, nombre] =
    hoja.getRange(fila, 1, 1, 7).getValues()[0];
  const libro = LIBROS_VENTA[idLibro];
  try {
    const pdf = DriveApp.getFileById(libro.pdf).getBlob()
      .setName(titulo.replace(/[^\wáéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '-').toLowerCase() + '.pdf');
    const saludo = nombre ? 'Hola, ' + escapar(String(nombre).split(' ')[0]) + ':' : 'Hola:';
    MailApp.sendEmail({
      to: correo,
      name: TIENDA.REMITENTE,
      replyTo: TIENDA.RESPONDER_A,
      subject: (reenvio ? '(Reenvío) ' : '') + 'Tu libro: ' + titulo + ' · Sudcalia Ediciones',
      attachments: [pdf],
      htmlBody:
        '<div style="font-family:Georgia,serif;color:#2A1420;max-width:560px;margin:auto;line-height:1.6">' +
        '<p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;color:#B88B4A;text-transform:uppercase;margin:0">Sudcalia Ediciones</p>' +
        '<h1 style="font-weight:600;color:#3D1227;margin:8px 0 16px">Gracias por tu compra</h1>' +
        '<p>' + saludo + '</p>' +
        '<p>Aquí tienes <b>' + escapar(titulo) + '</b>, Libro ' + libro.numero + ' de <i>La Saga de los Robles Eternos</i>. ' +
        'El PDF va adjunto a este correo. Guárdalo donde quieras y léelo en cualquier dispositivo.</p>' +
        '<p style="font-family:Arial,sans-serif;font-size:14px;background:#F7F1E3;padding:12px 16px;border-radius:8px">' +
        'Pedido: <b>' + pedido + '</b><br>Total: $' + precio + ' ' + TIENDA.MONEDA + '</p>' +
        '<p>Si tienes cualquier problema con el archivo, responde a este correo y te ayudamos.</p>' +
        '<p>Que la lluvia te acompañe,<br><i>F. C.</i></p>' +
        '<p style="font-family:Arial,sans-serif;font-size:12px;color:#6B5560;border-top:1px solid #EDE2CB;padding-top:12px;margin-top:24px">' +
        'Este libro es para tu uso personal. Por favor, no lo compartas: así ayudas a que la saga siga creciendo.<br>' +
        '<a href="' + TIENDA.SITIO + 'ediciones.html" style="color:#3D1227">Sudcalia Ediciones</a></p></div>'
    });
    hoja.getRange(fila, C.ESTADO).setValue('Entregado');
    hoja.getRange(fila, C.ENTREGADO).setValue(new Date());
    if (TIENDA.AVISAR_VENTA_A && !reenvio) {
      MailApp.sendEmail(TIENDA.AVISAR_VENTA_A, 'Sudcalia · Venta: ' + titulo + ' ($' + precio + ')',
        'Pedido ' + pedido + '\nCorreo: ' + correo + '\nNombre: ' + nombre + '\nEntregado automáticamente.');
    }
  } catch (err) {
    console.error(err);
    hoja.getRange(fila, C.ESTADO).setValue('Pagado');
    hoja.getRange(fila, C.NOTAS).setValue('Error al enviar: ' + err.message + ' (se reintentará)');
  }
}

function reintentarEnvio_(fila) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (hojaPedidos_().getRange(fila, C.ESTADO).getValue() === 'Pagado') entregar_(fila, false);
  } finally {
    lock.releaseLock();
  }
}

function buscarPagoAprobado_(pedido, paymentId) {
  if (paymentId) {
    const p = leerPago_(paymentId);
    if (p && p.external_reference === pedido && p.status === 'approved') return p;
  }
  const r = mp_('get', '/v1/payments/search?sort=date_created&criteria=desc&external_reference=' + encodeURIComponent(pedido));
  return ((r && r.results) || []).filter(x => x.status === 'approved')[0] || null;
}

function leerPago_(id) {
  if (!/^\d+$/.test(String(id))) return null;
  try { return mp_('get', '/v1/payments/' + id); } catch (e) { return null; }
}

function mp_(metodo, ruta, cuerpo) {
  const token = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!token) throw new Error('Falta MP_ACCESS_TOKEN en las propiedades del script.');
  const opciones = {
    method: metodo,
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  };
  if (cuerpo) {
    opciones.payload = JSON.stringify(cuerpo);
    opciones.headers['X-Idempotency-Key'] = Utilities.getUuid();
  }
  const res = UrlFetchApp.fetch('https://api.mercadopago.com' + ruta, opciones);
  const code = res.getResponseCode();
  if (code >= 300) throw new Error('Mercado Pago ' + code + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

function hojaPedidos_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(TIENDA.HOJA_PEDIDOS);
  if (!hoja) {
    hoja = libro.insertSheet(TIENDA.HOJA_PEDIDOS);
    hoja.getRange(1, 1, 1, COLS_PEDIDOS.length).setValues([COLS_PEDIDOS])
      .setFontWeight('bold').setBackground('#3D1227').setFontColor('#F7F1E3');
    hoja.setFrozenRows(1);
    hoja.setColumnWidths(1, COLS_PEDIDOS.length, 140);
    hoja.setColumnWidth(C.NOTAS, 320);
  }
  return hoja;
}

function buscarPedido_(pedido) {
  if (!/^SUD-\d{6}-[A-Z0-9]{6}$/.test(pedido)) return 0;
  const f = hojaPedidos_().getRange('B:B').createTextFinder(pedido).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}

function ocultarCorreo_(c) {
  const [u, d] = String(c).split('@');
  return (u.length <= 2 ? u[0] : u.slice(0, 2)) + '•••@' + d;
}
