/* Sudcalia — comportamiento del sitio */
(function () {
  "use strict";
  var C = window.SUDCALIA || {};

  // Menú móvil
  var boton = document.querySelector(".menu-boton");
  var menu = document.querySelector(".menu");
  if (boton && menu) {
    boton.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }

  // Año en el pie
  document.querySelectorAll("[data-anio]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Correo de contacto
  document.querySelectorAll("[data-correo]").forEach(function (el) {
    el.textContent = C.CORREO_CONTACTO;
    el.href = "mailto:" + C.CORREO_CONTACTO;
  });

  // Redes sociales
  var redes = document.querySelector("[data-redes]");
  if (redes && C.REDES) {
    var nombres = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", facebook: "Facebook" };
    Object.keys(nombres).forEach(function (k) {
      if (C.REDES[k]) {
        var a = document.createElement("a");
        a.href = C.REDES[k]; a.textContent = nombres[k]; a.target = "_blank"; a.rel = "noopener";
        redes.appendChild(a);
      }
    });
  }

  // Botones de compra de libros
  document.querySelectorAll("[data-libro]").forEach(function (el) {
    var url = C.LIBROS && C.LIBROS[el.getAttribute("data-libro")];
    if (url) {
      el.href = url; el.target = "_blank"; el.rel = "noopener";
      el.textContent = el.getAttribute("data-texto-activo") || "Conseguir";
    } else {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.classList.add("secundario");
      el.textContent = "Próximamente";
      el.addEventListener("click", function () {
        var f = document.getElementById("registro");
        if (f) f.scrollIntoView({ behavior: "smooth" });
      });
      el.style.cursor = "pointer";
    }
  });

  // Formularios → Apps Script (o correo como respaldo)
  document.querySelectorAll("form.formulario").forEach(function (form) {
    var msg = form.querySelector(".form-msg");
    var enviar = form.querySelector("button[type=submit]");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      if (form.querySelector(".trampa input").value) return; // anti-spam

      var datos = new FormData(form);
      datos.append("origen", document.body.getAttribute("data-pagina") || "sitio");
      datos.append("pagina", location.href);

      if (!C.APPS_SCRIPT_URL) {
        var cuerpo = [];
        datos.forEach(function (v, k) { if (k !== "web") cuerpo.push(k + ": " + v); });
        location.href = "mailto:" + C.CORREO_CONTACTO + "?subject=" +
          encodeURIComponent("Registro Sudcalia — " + (datos.get("interes") || "general")) +
          "&body=" + encodeURIComponent(cuerpo.join("\n"));
        return;
      }

      enviar.disabled = true;
      msg.className = "form-msg"; msg.textContent = "Enviando…";
      fetch(C.APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: new URLSearchParams(datos) })
        .then(function () {
          form.reset();
          msg.className = "form-msg ok";
          msg.textContent = "¡Listo! Te avisaremos en cuanto haya novedades.";
        })
        .catch(function () {
          msg.className = "form-msg error";
          msg.textContent = "No se pudo enviar. Escríbenos a " + C.CORREO_CONTACTO + ".";
        })
        .finally(function () { enviar.disabled = false; });
    });
  });
})();
