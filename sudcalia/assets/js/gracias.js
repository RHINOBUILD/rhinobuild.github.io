/* Sudcalia Ediciones: confirma el pedido al volver de Mercado Pago.
   El estado real lo decide Apps Script consultando a Mercado Pago, no la URL. */
(function () {
  "use strict";
  var caja = document.getElementById("gracias");
  if (!caja) return;
  var C = window.SUDCALIA || {};
  function param(n) { var m = new RegExp("[?&]" + n + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; }
  function esc(s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var pedido = param("pedido") || param("external_reference");
  var pago = param("payment_id") || param("collection_id");
  var intentos = 0;

  function pintar(titulo, texto, extra) {
    caja.innerHTML = '<span class="etiqueta">Pedido ' + esc(pedido) + "</span><h1>" + titulo + '</h1><p class="lead">' + texto + "</p>" + (extra || "");
  }
  var volver = '<div class="botones"><a class="boton" href="ediciones.html">Volver a la saga</a></div>';
  var ayuda = '<p class="suave nota">¿Dudas? Escríbenos a <a href="mailto:' + esc(C.CORREO_CONTACTO) + '?subject=' + encodeURIComponent("Pedido " + pedido) + '">' + esc(C.CORREO_CONTACTO) + "</a> con tu número de pedido.</p>";

  if (!pedido || !C.APPS_SCRIPT_URL) {
    pintar("Gracias por tu compra", "Si tu pago se aprobó, en unos minutos recibirás el libro en tu correo.", volver + ayuda);
    return;
  }

  function consultar() {
    intentos++;
    fetch(C.APPS_SCRIPT_URL + "?accion=confirmar&pedido=" + encodeURIComponent(pedido) + (pago ? "&payment_id=" + encodeURIComponent(pago) : ""))
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r.ok) { pintar("No encontramos tu pedido", "Revisa el enlace o escríbenos con tu número de pedido.", volver + ayuda); return; }
        var t = "<em>" + esc(r.titulo) + "</em>";
        if (r.estado === "Entregado") {
          pintar("¡Listo! Tu libro va en camino", "Enviamos " + t + " en PDF a <b>" + esc(r.correo) + "</b>. Si no lo ves en unos minutos, revisa la carpeta de spam o promociones.", volver + ayuda);
        } else if (r.estado === "Pagado") {
          pintar("Pago recibido", "Estamos enviando " + t + " a <b>" + esc(r.correo) + "</b>. Puede tardar unos minutos.", volver + ayuda);
        } else if (r.estado === "Rechazado") {
          pintar("El pago no se completó", "Mercado Pago no aprobó el pago, así que no se hizo ningún cargo. Puedes intentarlo de nuevo con otro método.", '<div class="botones"><a class="boton" href="ediciones.html">Intentar de nuevo</a></div>' + ayuda);
        } else if (r.estado === "En espera") {
          pintar("Tu pago está en proceso", "Si pagaste en OXXO o por transferencia, Mercado Pago tarda en acreditarlo. En cuanto se acredite te enviaremos " + t + " a <b>" + esc(r.correo) + "</b>; no tienes que hacer nada más.", volver + ayuda);
        } else if (intentos < 12) {
          pintar("Confirmando tu pago…", "Estamos verificando el pago con Mercado Pago. No cierres esta página.", '<div class="cargando" aria-hidden="true"></div>');
          setTimeout(consultar, 5000);
        } else {
          pintar("Aún no vemos tu pago", "Si ya pagaste, no te preocupes: revisamos los pagos cada pocos minutos y te enviaremos " + t + " a <b>" + esc(r.correo) + "</b> en cuanto se acredite.", volver + ayuda);
        }
      })
      .catch(function () {
        if (intentos < 4) { setTimeout(consultar, 4000); return; }
        pintar("Gracias por tu compra", "No pudimos confirmar el estado ahora mismo, pero si tu pago se aprobó recibirás el libro en tu correo en unos minutos.", volver + ayuda);
      });
  }
  pintar("Confirmando tu pago…", "Un momento, estamos verificando tu pago con Mercado Pago.", '<div class="cargando" aria-hidden="true"></div>');
  consultar();
})();
