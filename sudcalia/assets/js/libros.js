/* Sudcalia Ediciones: catálogo, ficha de libro y lector de muestra.
   Todo sale de assets/data/libros.json, así que no hace falta tocar el HTML. */
(function () {
  "use strict";

  var DATOS = "assets/data/libros.json";
  var catalogo = document.getElementById("catalogo");
  var ficha = document.getElementById("ficha");
  var lector = document.getElementById("lector");
  var catalogoOtros = document.getElementById("catalogo-otros");
  if (!catalogo && !ficha && !lector && !catalogoOtros) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function precio(l) {
    return l.precio > 0 ? "$" + l.precio + " " + (l.moneda || "MXN") : "Gratis";
  }
  function idx(l, lista) { return lista.indexOf(l) + 1; }
  function param(nombre) {
    var m = new RegExp("[?&]" + nombre + "=([^&]+)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function urlSegura(u) { return /^(https?:\/\/|assets\/)/.test(u || "") ? u : ""; }

  function portada(l, n, autor) {
    var img = urlSegura(l.portada);
    if (img) {
      return '<div class="portada portada-img"><img src="' + esc(img) + '" alt="Portada de ' + esc(l.titulo) + '" loading="lazy"></div>';
    }
    return '<div class="portada p' + n + '" role="img" aria-label="Portada de ' + esc(l.titulo) + '">' +
      '<span class="num">Libro ' + esc(l.numero) + '</span>' +
      '<span class="titulo">' + esc(l.titulo) + '</span>' +
      '<span class="autor">' + esc(autor) + '</span></div>';
  }

  // Botones de compra/lectura según los enlaces que existan
  function botones(l) {
    var e = l.enlaces || {}, b = [], gratis = !(l.precio > 0);
    function btn(url, texto, clase) {
      url = urlSegura(url);
      if (url) b.push('<a class="boton ' + (clase || "") + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + texto + "</a>");
    }
    if (gratis) {
      btn(e.descarga_gratis, "Descargar gratis");
      btn(e.google_play, "Leer gratis en Google Play", b.length ? "secundario" : "");
    } else {
      var C = window.SUDCALIA || {};
      if (l.venta_directa && C.APPS_SCRIPT_URL) {
        b.push('<button type="button" class="boton" data-comprar="' + esc(l.id) + '">Comprar · ' + esc(precio(l)) + "</button>");
      }
      btn(e.mercado_pago, "Comprar · " + esc(precio(l)), b.length ? "secundario" : "");
      btn(e.google_play, "Comprar en Google Play", b.length ? "secundario" : "");
    }
    btn(e.amazon, "Comprar en Amazon", b.length ? "secundario" : "");
    return b;
  }

  function tarjeta(l, n, autor) {
    var href = "libro.html?libro=" + encodeURIComponent(l.id);
    var hay = botones(l).length > 0;
    return '<article class="libro">' +
      '<a href="' + href + '" class="libro-enlace" aria-label="Ver ' + esc(l.titulo) + '">' + portada(l, n, autor) + "</a>" +
      '<h3><a href="' + href + '">' + esc(l.titulo) + "</a></h3>" +
      '<p class="precio' + (l.precio > 0 ? "" : " gratis") + '">' + esc(precio(l)) +
      (hay ? "" : ' <span class="suave">· próximamente</span>') + "</p>" +
      '<a class="boton secundario" href="' + href + '">Ver el libro</a>' +
      "</article>";
  }

  // Muestra en texto simple: # título, párrafos separados por línea en blanco, *cursiva*, **negrita**, "* * *" corte de escena
  function markdown(txt) {
    return txt.replace(/\r/g, "").split(/\n\s*\n/).map(function (bloque) {
      var t = bloque.trim();
      if (!t) return "";
      if (/^(\*\s*){3,}$/.test(t) || /^-{3,}$/.test(t)) return '<p class="corte" aria-hidden="true">✦ ✦ ✦</p>';
      var h = /^(#{1,3})\s+(.*)$/.exec(t);
      var html = esc(h ? h[2] : t)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
      if (h) return "<h" + (h[1].length + 1) + ">" + html + "</h" + (h[1].length + 1) + ">";
      return "<p>" + html + "</p>";
    }).join("");
  }

  function jsonLd(l, saga, suelto) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    var obj = {
      "@context": "https://schema.org", "@type": "Book",
      name: l.titulo, author: { "@type": "Person", name: saga.autor },
      publisher: { "@type": "Organization", name: "Sudcalia Ediciones" },
      inLanguage: "es-MX",
      offers: { "@type": "Offer", price: String(l.precio || 0), priceCurrency: l.moneda || "MXN" }
    };
    if (!suelto) { obj.isPartOf = { "@type": "BookSeries", name: saga.nombre }; obj.position = l.numero; }
    if (l.genero) obj.genre = l.genero;
    if (l.sinopsis) obj.description = l.sinopsis;
    if (urlSegura(l.portada)) obj.image = new URL(l.portada, location.href).href;
    if (l.paginas) obj.numberOfPages = Number(l.paginas) || undefined;
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  // Diálogo de compra: pide correo y manda a pagar a Mercado Pago
  function activarCompra(l) {
    var boton = document.querySelector("[data-comprar]");
    var C = window.SUDCALIA || {};
    if (!boton || !C.APPS_SCRIPT_URL) return;
    var dlg = document.createElement("dialog");
    dlg.className = "dialogo-compra";
    dlg.innerHTML =
      '<form class="formulario" method="dialog" novalidate>' +
        '<button type="button" class="cerrar" aria-label="Cerrar">×</button>' +
        '<span class="etiqueta">Comprar' + (l.numero ? " · Libro " + esc(l.numero) : "") + "</span>" +
        "<h2>" + esc(l.titulo) + "</h2>" +
        '<p class="suave">Te enviaremos el PDF a este correo en cuanto se acredite el pago.</p>' +
        '<div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" name="nombre" autocomplete="name" maxlength="120"></div>' +
        '<div class="campo"><label for="c-correo">Correo electrónico</label><input id="c-correo" name="correo" type="email" autocomplete="email" required maxlength="160"></div>' +
        '<div class="campo"><label for="c-correo2">Confirma tu correo</label><input id="c-correo2" name="correo2" type="email" autocomplete="email" required maxlength="160"></div>' +
        '<label class="check"><input type="checkbox" name="acepto" value="si" required><span>Acepto el <a href="privacidad.html" target="_blank">aviso de privacidad</a>.</span></label>' +
        '<button class="boton" type="submit">Ir a pagar · ' + esc(precio(l)) + "</button>" +
        '<p class="form-msg" role="status" aria-live="polite"></p>' +
        '<p class="suave pago-nota">Serás dirigido a Mercado Pago. Sudcalia no ve ni guarda los datos de tu tarjeta.</p>' +
      "</form>";
    document.body.appendChild(dlg);
    var f = dlg.querySelector("form"), msg = dlg.querySelector(".form-msg"), enviar = dlg.querySelector("[type=submit]");
    boton.addEventListener("click", function () { dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", ""); });
    dlg.querySelector(".cerrar").addEventListener("click", function () { dlg.close(); });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!f.reportValidity()) return;
      var correo = f.correo.value.trim().toLowerCase();
      if (correo !== f.correo2.value.trim().toLowerCase()) {
        msg.className = "form-msg error"; msg.textContent = "Los correos no coinciden."; return;
      }
      enviar.disabled = true; msg.className = "form-msg"; msg.textContent = "Preparando tu pago…";
      var q = "?accion=pagar&libro=" + encodeURIComponent(l.id) + "&correo=" + encodeURIComponent(correo) +
        "&nombre=" + encodeURIComponent(f.nombre.value.trim()) + "&acepto=si";
      fetch(C.APPS_SCRIPT_URL + q).then(function (r) { return r.json(); }).then(function (r) {
        if (r.ok && /^https:\/\/[a-z0-9.-]*mercadopago\.com/.test(r.url)) { location.href = r.url; return; }
        var errores = { correo: "Revisa tu correo.", limite: "Demasiados intentos. Espera un rato e inténtalo de nuevo.", libro: "Este libro no está a la venta todavía." };
        throw new Error(errores[r.error] || "No pudimos iniciar el pago.");
      }).catch(function (e) {
        enviar.disabled = false; msg.className = "form-msg error";
        msg.textContent = (e && e.message && e.message.length < 90 ? e.message : "No pudimos iniciar el pago.") + " Si sigue fallando, escríbenos a " + (C.CORREO_CONTACTO || "contacto@rhinobuild.org") + ".";
      });
    });
  }

  fetch(DATOS, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var saga = d.saga || {}, lista = d.libros || [], otros = d.otros || [];
    var todos = lista.concat(otros);
    function esSuelto(l) { return otros.indexOf(l) >= 0; }
    function aplicarTema(l) { if (l.tema) document.body.classList.add("t-" + String(l.tema).replace(/[^a-z-]/g, "")); }

    // ── Catálogo (ediciones.html)
    if (catalogo) {
      catalogo.innerHTML = lista.map(function (l) { return tarjeta(l, idx(l, lista), saga.autor); }).join("");
    }
    if (catalogoOtros) {
      catalogoOtros.innerHTML = otros.map(function (l, i) { return tarjeta(l, i + 1, saga.autor); }).join("");
    }

    // ── Ficha (libro.html?libro=libro-1)
    if (ficha) {
      var l = todos.filter(function (x) { return x.id === param("libro"); })[0] || lista[0];
      var suelto = esSuelto(l);
      var n = suelto ? 1 : idx(l, lista);
      aplicarTema(l);
      document.title = l.titulo + " · " + (suelto ? "Sudcalia Ediciones" : (saga.nombre || "Sudcalia Ediciones"));
      var desc = document.querySelector('meta[name="description"]');
      if (desc && l.sinopsis) desc.setAttribute("content", l.sinopsis.slice(0, 155));
      var bts = botones(l);
      var muestra = urlSegura(l.muestra) ? '<a class="boton secundario" href="leer.html?libro=' + encodeURIComponent(l.id) + '">' + (suelto && l.muestra_boton ? esc(l.muestra_boton) : "Leer una muestra") + "</a>" : "";
      var directa = bts.join("").indexOf("data-comprar") >= 0;
      var compra = bts.length
        ? '<div class="botones">' + bts.join("") + muestra + "</div>" +
          (directa ? '<p class="suave nota">Pago seguro con Mercado Pago: tarjeta, OXXO o transferencia. Recibes el libro en PDF en tu correo en cuanto se acredita el pago.</p>' : "")
        : '<div class="botones"><a class="boton" href="#registro">Avísame cuando salga</a>' + muestra + '</div><p class="suave nota">Estamos preparando la edición. Déjanos tu correo y te avisamos el día que esté disponible.</p>';
      var sinopsis = l.sinopsis
        ? l.sinopsis.split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("")
        : '<p class="suave">' + (n === 1
            ? "El libro que abre la saga. Empieza aquí, es gratis."
            : "El libro " + esc(l.numero) + " de " + esc(saga.nombre) + ". Continúa justo donde terminó el anterior.") + "</p>";
      var resto = (suelto ? lista : lista.filter(function (x) { return x !== l; })).map(function (x) { return tarjeta(x, idx(x, lista), saga.autor); }).join("") +
        otros.filter(function (x) { return x !== l; }).map(function (x, i) { return tarjeta(x, i + 1, saga.autor); }).join("");
      var anterior = suelto ? null : lista[n - 2], siguiente = suelto ? null : lista[n];

      ficha.innerHTML =
        '<div class="ficha">' +
          '<div class="ficha-portada">' + portada(l, n, saga.autor) + "</div>" +
          '<div class="ficha-info">' +
            '<span class="etiqueta">' + (suelto ? esc(l.genero || "Sudcalia Ediciones") : esc(saga.nombre) + " · Libro " + esc(l.numero)) + "</span>" +
            "<h1>" + esc(l.titulo) + "</h1>" +
            (l.frase ? '<p class="lead">' + esc(l.frase) + "</p>" : "") +
            '<p class="precio grande' + (l.precio > 0 ? "" : " gratis") + '">' + esc(precio(l)) + "</p>" +
            compra +
            '<div class="sinopsis"><h2>Sinopsis</h2>' + sinopsis + "</div>" +
            '<dl class="datos-libro">' +
              "<div><dt>Autor</dt><dd>" + esc(saga.autor) + "</dd></div>" +
              (suelto
                ? (l.genero ? "<div><dt>Género</dt><dd>" + esc(l.genero) + "</dd></div>" : "") +
                  (l.edad ? "<div><dt>Lectores</dt><dd>" + esc(String(l.edad).replace("+", "")) + " años en adelante</dd></div>" : "") +
                  (l.edicion ? "<div><dt>Edición</dt><dd>" + esc(l.edicion) + "</dd></div>" : "")
                : "<div><dt>Saga</dt><dd>" + esc(saga.nombre) + " (" + n + " de " + lista.length + ")</dd></div>") +
              (l.paginas ? "<div><dt>Páginas</dt><dd>" + esc(l.paginas) + "</dd></div>" : "") +
              "<div><dt>Idioma</dt><dd>Español</dd></div>" +
              "<div><dt>Edita</dt><dd>Sudcalia Ediciones</dd></div>" +
            "</dl>" +
            (suelto ? "" : '<nav class="saga-nav">' +
              (anterior ? '<a href="libro.html?libro=' + encodeURIComponent(anterior.id) + '">← Libro ' + esc(anterior.numero) + "</a>" : "<span></span>") +
              (siguiente ? '<a href="libro.html?libro=' + encodeURIComponent(siguiente.id) + '">Libro ' + esc(siguiente.numero) + " →</a>" : "") +
            "</nav>") +
          "</div>" +
        "</div>";
      var cajaResto = document.getElementById("resto-saga");
      if (cajaResto) cajaResto.innerHTML = resto;
      var restoEtiqueta = document.getElementById("resto-etiqueta"), restoTitulo = document.getElementById("resto-titulo");
      if (restoEtiqueta) restoEtiqueta.textContent = suelto ? "Sudcalia Ediciones" : "Más de Sudcalia Ediciones";
      if (restoTitulo) restoTitulo.textContent = "También de " + (saga.autor || "F. C.");
      if (suelto && bts.length) {
        var regT = document.querySelector("#registro h2"), regP = document.querySelector("#registro .suave");
        if (regT) regT.textContent = "Avísame de los próximos libros.";
        if (regP) regP.textContent = "Te escribimos cuando " + (saga.autor || "F. C.") + " publique algo nuevo.";
      }
      var sel = document.getElementById("f-interes");
      if (sel) sel.value = "ediciones";
      jsonLd(l, saga, suelto);
      activarCompra(l);
    }

    // ── Lector de muestra (leer.html?libro=libro-1)
    if (lector) {
      var lb = todos.filter(function (x) { return x.id === param("libro"); })[0] || lista[0];
      aplicarTema(lb);
      document.title = "Muestra: " + lb.titulo + " · Sudcalia Ediciones";
      var cab = '<span class="etiqueta">Muestra gratuita · ' + (esSuelto(lb) ? esc(lb.muestra_titulo || "Primeras páginas") : "Libro " + esc(lb.numero)) + "</span><h1>" + esc(lb.titulo) + '</h1><p class="suave">' + esc(saga.autor) + "</p>";
      var cierre = '<div class="fin-muestra"><p>Aquí termina la muestra.</p><a class="boton" href="libro.html?libro=' + encodeURIComponent(lb.id) + '">Seguir leyendo</a></div>';
      if (!urlSegura(lb.muestra)) {
        lector.innerHTML = cab + '<p>La muestra de este libro estará disponible pronto.</p>' + cierre;
        return;
      }
      fetch(lb.muestra, { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (t) {
        lector.innerHTML = cab + '<div class="texto">' + markdown(t) + "</div>" + cierre;
      }).catch(function () {
        lector.innerHTML = cab + "<p>No pudimos cargar la muestra. Intenta más tarde.</p>" + cierre;
      });
    }
  }).catch(function () {
    var el = catalogo || ficha || lector;
    if (el && !catalogo && !catalogoOtros) el.innerHTML = '<p>No pudimos cargar la información del libro. <a href="ediciones.html">Volver a la saga</a>.</p>';
  });
})();
