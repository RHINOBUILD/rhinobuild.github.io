/**
 * SUDCALIA · Registro de interesados (Code.gs) + Tienda de libros (Tienda.gs)
 * Recibe los formularios del sitio (GitHub Pages) y los guarda en Google Sheets.
 * La venta de libros con Mercado Pago está en Tienda.gs; las instrucciones de la
 * tienda están al inicio de ese archivo.
 *
 * Instalación:
 *  1. Crea una hoja de cálculo nueva en Google Drive llamada "Sudcalia · Registros".
 *  2. Menú Extensiones → Apps Script. Borra el contenido y pega este archivo.
 *  3. Ejecuta una vez la función `configurar` y autoriza los permisos.
 *  4. Implementar → Nueva implementación → Tipo: Aplicación web
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *  5. Copia la URL que termina en /exec y pégala en assets/js/config.js (APPS_SCRIPT_URL).
 *
 * Cada vez que cambies este código: Implementar → Gestionar implementaciones →
 * editar (lápiz) → Versión: Nueva versión. Así la URL no cambia.
 */

// ── Ajustes ─────────────────────────────────────────────
const AJUSTES = {
  HOJA: 'Registros',
  // Correo que recibe un aviso por cada registro nuevo ('' para desactivar)
  AVISAR_A: 'contacto@rhinobuild.org',
  // Máximo de registros aceptados por correo cada 6 h (anti-abuso)
  LIMITE_POR_CORREO: 3
};

const COLUMNAS = ['Fecha', 'Nombre', 'Correo', 'Interés', 'Mensaje', 'Origen', 'Página', 'Acepta aviso', 'Estado'];
const INTERESES = ['general', 'ediciones', 'estudios', 'play', 'games', 'rhinobuild'];

/** Ejecútala una vez para crear la hoja con encabezados y formato. */
function configurar() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(AJUSTES.HOJA);
  if (!hoja) hoja = libro.insertSheet(AJUSTES.HOJA);
  hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS])
    .setFontWeight('bold').setBackground('#0F3B57').setFontColor('#F3EADB');
  hoja.setFrozenRows(1);
  hoja.setColumnWidths(1, COLUMNAS.length, 160);
  hoja.setColumnWidth(5, 320);
  // Lista desplegable de estado para dar seguimiento
  const regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Nuevo', 'Contactado', 'Baja'], true).build();
  hoja.getRange(2, 9, hoja.getMaxRows() - 1, 1).setDataValidation(regla);
  return 'Hoja lista';
}

/** Punto de entrada POST: avisos de Mercado Pago o formularios de registro. */
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.accion === 'webhook') return tiendaWebhook(e);
  return registrar(e);
}

/** Punto de entrada GET: acciones de la tienda o prueba de vida. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.accion === 'pagar') return tiendaPagar(p);
  if (p.accion === 'confirmar') return tiendaConfirmar(p);
  if (p.accion === 'webhook') return tiendaWebhook(e);
  return responder({ ok: true, servicio: 'Sudcalia · Registros y Tienda' });
}

/** Guarda un registro de interesado. */
function registrar(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = (e && e.parameter) || {};

    // Anti-spam: campo trampa y validaciones mínimas
    if (p.web) return responder({ ok: true });
    const nombre = limpiar(p.nombre, 120);
    const correo = limpiar(p.correo, 160).toLowerCase();
    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return responder({ ok: false, error: 'datos' });
    if (p.acepto !== 'si') return responder({ ok: false, error: 'aviso' });

    const interes = INTERESES.indexOf(p.interes) >= 0 ? p.interes : 'general';
    const mensaje = limpiar(p.mensaje, 1500);
    const origen = limpiar(p.origen, 40);
    const pagina = limpiar(p.pagina, 300);

    // Límite por correo cada 6 h
    const cache = CacheService.getScriptCache();
    const clave = 'n_' + Utilities.base64EncodeWebSafe(correo).slice(0, 200);
    const veces = Number(cache.get(clave) || 0);
    if (veces >= AJUSTES.LIMITE_POR_CORREO) return responder({ ok: true });
    cache.put(clave, String(veces + 1), 21600);

    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AJUSTES.HOJA) ||
      (configurar(), SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AJUSTES.HOJA));
    hoja.appendRow([new Date(), nombre, correo, interes, mensaje, origen, pagina, 'Sí', 'Nuevo']);

    if (AJUSTES.AVISAR_A) {
      MailApp.sendEmail({
        to: AJUSTES.AVISAR_A,
        subject: 'Sudcalia · Nuevo registro (' + interes + ')',
        htmlBody:
          '<div style="font-family:Arial,sans-serif;color:#121820">' +
          '<h2 style="color:#0F3B57;margin:0 0 12px">Nuevo registro en Sudcalia</h2>' +
          '<p><b>Nombre:</b> ' + escapar(nombre) + '<br><b>Correo:</b> ' + escapar(correo) +
          '<br><b>Interés:</b> ' + escapar(interes) + '<br><b>Página:</b> ' + escapar(origen) + '</p>' +
          (mensaje ? '<p><b>Mensaje:</b><br>' + escapar(mensaje).replace(/\n/g, '<br>') + '</p>' : '') +
          '<p style="color:#5B6470;font-size:12px">Guardado en la hoja "' + AJUSTES.HOJA + '".</p></div>'
      });
    }
    return responder({ ok: true });
  } catch (err) {
    console.error(err);
    return responder({ ok: false, error: 'servidor' });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// ── Utilidades ──────────────────────────────────────────
function limpiar(v, max) {
  let s = String(v || '').trim().slice(0, max);
  // Evita que un valor se interprete como fórmula en Sheets
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function escapar(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
