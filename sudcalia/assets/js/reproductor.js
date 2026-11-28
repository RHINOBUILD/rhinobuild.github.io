/* Sudcalia Play · Reproductor de series con lista de episodios.
   Para publicar un capítulo nuevo: cambia "disponible" a true y llena video, poster, duracion y sinopsis. */
(function () {
  "use strict";

  var SERIE = {
    id: "datil-amargo",
    titulo: "Dátil Amargo",
    temporadas: [
      {
        numero: 1,
        trailer: {
          titulo: "Tráiler de la temporada 1",
          video: "assets/video/datil-amargo-trailer-t1.mp4",
          poster: "assets/video/datil-amargo-trailer-t1.jpg",
          sinopsis: "Durante 30 años una familia del oasis de San Dátil guardó un secreto, hasta que llegó una forastera con la verdad en sus manos."
        },
        episodios: [
          { numero: 1, titulo: "La forastera", disponible: true, duracion: "2:32",
            video: "assets/video/datil-amargo-t1-cap01.mp4", poster: "assets/video/datil-amargo-t1-cap01.jpg",
            sinopsis: "En el oasis de San Dátil todo crece despacio… hasta que llega ella. Una pitaya forastera con un collar que hace temblar a la patrona." },
          { numero: 2, titulo: "Agua turbia", disponible: true, duracion: "2:52",
            video: "assets/video/datil-amargo-t1-cap02.mp4", poster: "assets/video/datil-amargo-t1-cap02.jpg",
            sinopsis: "Higinio le cierra el agua a La Esperanza y el palmar empieza a secarse. Alma recuerda una acequia olvidada que podría salvarlo todo… mientras alguien los vigila desde la loma." },
          { numero: 3, titulo: "Veneno de guayaba", disponible: true, duracion: "2:29",
            video: "assets/video/datil-amargo-t1-cap03.mp4", poster: "assets/video/datil-amargo-t1-cap03.jpg",
            sinopsis: "Desaparece el dinero de la raya y una flor blanca apunta a la forastera. Remedios la echa de La Esperanza… pero en San Dátil nada se queda escondido mucho tiempo." },
          { numero: 4, titulo: "Confesión", disponible: true, duracion: "2:30",
            video: "assets/video/datil-amargo-t1-cap04.mp4", poster: "assets/video/datil-amargo-t1-cap04.jpg",
            sinopsis: "Leticia amenaza a Chona para que guarde silencio. El Padre Tuno reconoce el collar de Alma… y esa misma noche Remedios confiesa el secreto que guardó treinta años, sin saber que alguien la escucha." },
          { numero: 5, titulo: "Sangre de higo", disponible: true, duracion: "1:55",
            video: "assets/video/datil-amargo-t1-cap05.mp4", poster: "assets/video/datil-amargo-t1-cap05.jpg",
            sinopsis: "Higinio descubre que Rodrigo es su hijo, le devuelve el agua a La Esperanza y le muestra la marca que comparten. Rodrigo ya no puede callar: esta noche quiere la verdad de su madre." },
          { numero: 6, titulo: "La noche del quinqué", disponible: true, duracion: "1:50",
            video: "assets/video/datil-amargo-t1-cap06.mp4", poster: "assets/video/datil-amargo-t1-cap06.jpg",
            sinopsis: "Remedios lo niega todo y quema la foto de Esperanza. En los libros de la misión, Alma encuentra un acta imposible… y una firma que lo cambia todo." },
          { numero: 7, titulo: "Limón partido", disponible: true, duracion: "1:50",
            video: "assets/video/datil-amargo-t1-cap07.mp4", poster: "assets/video/datil-amargo-t1-cap07.jpg",
            sinopsis: "Alma descubre en su morral la escritura que explica por qué dieron por muerta a su abuela. Toño, despechado, se alía con Leticia, y en el arroyo le roban el morral… con el secreto adentro." },
          { numero: 8, disponible: false },
          { numero: 9, disponible: false },
          { numero: 10, disponible: false }
        ]
      },
      { numero: 2, proximamente: true, episodios: [] }
    ]
  };

  var raiz = document.querySelector("[data-reproductor]");
  if (!raiz) return;

  var video = raiz.querySelector(".rep-video");
  var etiqueta = raiz.querySelector(".rep-etiqueta");
  var titulo = raiz.querySelector(".rep-titulo");
  var sinopsis = raiz.querySelector(".rep-sinopsis");
  var lista = raiz.querySelector(".rep-lista");
  var pestanas = raiz.querySelector(".rep-temporadas");
  var siguienteCaja = raiz.querySelector(".rep-siguiente");
  var siguienteTexto = raiz.querySelector(".rep-siguiente-texto");
  var siguienteYa = raiz.querySelector(".rep-siguiente-ya");
  var siguienteCancelar = raiz.querySelector(".rep-siguiente-cancelar");
  var continuarCaja = raiz.querySelector(".rep-continuar");
  var CLAVE = "sudcalia-play-" + SERIE.id;

  var temporadaActual = 1;
  var actual = null; // { t, ep (null = tráiler) }
  var cuenta = null;

  /* ---- Progreso guardado (solo en este navegador) ---- */
  function leerProgreso() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
  }
  function guardarProgreso(datos) {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* sin almacenamiento */ }
  }
  function clave(t, ep) { return "t" + t + "e" + ep; }

  function temporada(n) {
    for (var i = 0; i < SERIE.temporadas.length; i++) if (SERIE.temporadas[i].numero === n) return SERIE.temporadas[i];
    return null;
  }
  function episodio(t, n) {
    var tem = temporada(t);
    if (!tem) return null;
    for (var i = 0; i < tem.episodios.length; i++) if (tem.episodios[i].numero === n) return tem.episodios[i];
    return null;
  }
  function siguienteDe(t, n) {
    var ep = episodio(t, n + 1);
    return ep && ep.disponible ? ep : null;
  }

  /* ---- Pestañas de temporada ---- */
  function pintarPestanas() {
    pestanas.innerHTML = "";
    SERIE.temporadas.forEach(function (tem) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rep-tab";
      b.textContent = "Temporada " + tem.numero + (tem.proximamente ? " · Próximamente" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", tem.numero === temporadaActual ? "true" : "false");
      if (tem.proximamente) b.disabled = true;
      b.addEventListener("click", function () { temporadaActual = tem.numero; pintarPestanas(); pintarLista(); });
      pestanas.appendChild(b);
    });
  }

  /* ---- Lista de episodios ---- */
  function pintarLista() {
    var tem = temporada(temporadaActual);
    var prog = leerProgreso();
    lista.innerHTML = "";
    if (tem.trailer) lista.appendChild(itemLista(tem.numero, null, tem.trailer, prog));
    tem.episodios.forEach(function (ep) { lista.appendChild(itemLista(tem.numero, ep.numero, ep, prog)); });
  }

  function itemLista(t, n, ep, prog) {
    var li = document.createElement("li");
    var esTrailer = n === null;
    var disponible = esTrailer || ep.disponible;
    var b = document.createElement(disponible ? "button" : "div");
    b.className = "rep-item" + (disponible ? "" : " bloqueado");
    if (disponible) b.type = "button";
    if (actual && actual.t === t && actual.ep === n) { b.classList.add("activo"); b.setAttribute("aria-current", "true"); }

    var mini = document.createElement("span");
    mini.className = "rep-mini";
    if (disponible) mini.style.backgroundImage = "url('" + ep.poster + "')";
    else mini.textContent = n;

    var texto = document.createElement("span");
    texto.className = "rep-item-texto";
    var arriba = document.createElement("small");
    arriba.textContent = esTrailer ? "Tráiler" : "Capítulo " + n + (disponible ? " · " + ep.duracion : "");
    var nombre = document.createElement("strong");
    nombre.textContent = esTrailer ? "Tráiler de la temporada" : (disponible ? ep.titulo : "Próximamente");
    texto.appendChild(arriba);
    texto.appendChild(nombre);

    if (!esTrailer && disponible) {
      var p = prog[clave(t, n)];
      if (p && p.visto) {
        var visto = document.createElement("em");
        visto.className = "rep-visto";
        visto.textContent = "Visto";
        texto.appendChild(visto);
      } else if (p && p.pos > 5 && p.dur) {
        var barra = document.createElement("span");
        barra.className = "rep-barra";
        barra.innerHTML = "<span style=\"width:" + Math.min(100, Math.round(p.pos / p.dur * 100)) + "%\"></span>";
        texto.appendChild(barra);
      }
    }

    b.appendChild(mini);
    b.appendChild(texto);
    if (disponible) b.addEventListener("click", function () { cargar(t, n, true); });
    li.appendChild(b);
    return li;
  }

  /* ---- Cargar un episodio ---- */
  function cargar(t, n, reproducir, desde) {
    cancelarCuenta();
    var tem = temporada(t);
    var ep = n === null ? tem.trailer : episodio(t, n);
    if (!ep || (n !== null && !ep.disponible)) return;
    actual = { t: t, ep: n };
    temporadaActual = t;

    video.poster = ep.poster;
    video.src = ep.video;
    etiqueta.textContent = SERIE.titulo + " · Temporada " + t + (n === null ? " · Tráiler" : " · Capítulo " + n);
    titulo.textContent = n === null ? "Tráiler" : ep.titulo;
    sinopsis.textContent = ep.sinopsis;

    if (desde) {
      video.addEventListener("loadedmetadata", function irA() {
        video.removeEventListener("loadedmetadata", irA);
        try { video.currentTime = desde; } catch (e) { /* ignorar */ }
      });
    }
    if (reproducir) {
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () { /* el navegador pidió un toque */ });
    }

    var hash = n === null ? "#t" + t + "-trailer" : "#" + clave(t, n);
    if (location.hash !== hash) history.replaceState(null, "", hash);
    if (continuarCaja) continuarCaja.hidden = true;
    pintarPestanas();
    pintarLista();
  }

  /* ---- Guardar avance mientras se ve ---- */
  var ultimoGuardado = 0;
  video.addEventListener("timeupdate", function () {
    if (!actual || actual.ep === null) return;
    var ahora = Date.now();
    if (ahora - ultimoGuardado < 3000) return;
    ultimoGuardado = ahora;
    var prog = leerProgreso();
    var k = clave(actual.t, actual.ep);
    var previo = prog[k] || {};
    prog[k] = { pos: video.currentTime, dur: video.duration || 0, visto: previo.visto || false };
    prog.ultimo = { t: actual.t, ep: actual.ep };
    guardarProgreso(prog);
  });

  /* ---- Al terminar: marcar visto y pasar al siguiente ---- */
  video.addEventListener("ended", function () {
    if (!actual) return;
    var prog = leerProgreso();
    if (actual.ep !== null) {
      prog[clave(actual.t, actual.ep)] = { pos: 0, dur: video.duration || 0, visto: true };
      guardarProgreso(prog);
    }
    var sig = actual.ep === null ? episodio(actual.t, 1) : siguienteDe(actual.t, actual.ep);
    if (sig && sig.disponible) iniciarCuenta(actual.t, sig);
    else {
      pintarLista();
      siguienteTexto.textContent = "Ya viste todo lo disponible. El próximo capítulo llega pronto.";
      siguienteYa.hidden = true;
      siguienteCancelar.textContent = "Cerrar";
      siguienteCaja.hidden = false;
    }
  });

  function iniciarCuenta(t, sig) {
    var seg = 5;
    siguienteYa.hidden = false;
    siguienteCancelar.textContent = "Cancelar";
    siguienteCaja.hidden = false;
    function texto() { siguienteTexto.textContent = "Capítulo " + sig.numero + ": " + sig.titulo + " empieza en " + seg + "…"; }
    texto();
    siguienteYa.onclick = function () { cargar(t, sig.numero, true); };
    cuenta = setInterval(function () {
      seg -= 1;
      if (seg <= 0) { cargar(t, sig.numero, true); return; }
      texto();
    }, 1000);
  }
  function cancelarCuenta() {
    if (cuenta) { clearInterval(cuenta); cuenta = null; }
    siguienteCaja.hidden = true;
  }
  siguienteCancelar.addEventListener("click", cancelarCuenta);
  video.addEventListener("play", function () { if (cuenta) cancelarCuenta(); });

  /* ---- Enlaces directos: #t1e3, #t1-trailer y los antiguos #capitulo-3 / #trailer ---- */
  function desdeHash() {
    var h = location.hash;
    var m = h.match(/^#t(\d+)e(\d+)$/) || h.match(/^#capitulo-(\d+)$/);
    if (m) {
      var t = m.length === 3 ? parseInt(m[1], 10) : 1;
      var n = parseInt(m.length === 3 ? m[2] : m[1], 10);
      var ep = episodio(t, n);
      if (ep && ep.disponible) return { t: t, ep: n };
    }
    var tr = h.match(/^#t(\d+)-trailer$/);
    if (tr) return { t: parseInt(tr[1], 10), ep: null };
    if (h === "#trailer") return { t: 1, ep: null };
    return null;
  }

  function irAlReproductor() {
    var y = raiz.getBoundingClientRect().top + window.pageYOffset - 70;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  window.addEventListener("hashchange", function () {
    var d = desdeHash();
    if (d) { cargar(d.t, d.ep, false); irAlReproductor(); }
  });

  /* ---- Arranque ---- */
  var inicio = desdeHash();
  var prog = leerProgreso();
  if (inicio) {
    cargar(inicio.t, inicio.ep, false);
    setTimeout(irAlReproductor, 60);
  } else {
    // Sin enlace directo: el último capítulo publicado, y si hay avance guardado, ofrecer continuar.
    var ultimoPublicado = null;
    temporada(1).episodios.forEach(function (ep) { if (ep.disponible) ultimoPublicado = ep.numero; });
    var u = prog.ultimo;
    if (u && episodio(u.t, u.ep) && episodio(u.t, u.ep).disponible) {
      var p = prog[clave(u.t, u.ep)] || {};
      cargar(u.t, u.ep, false, p.visto ? 0 : p.pos);
      if (continuarCaja && p.pos > 5 && !p.visto) {
        var ep = episodio(u.t, u.ep);
        continuarCaja.querySelector("span").textContent = "Te quedaste en el capítulo " + u.ep + ": " + ep.titulo + ".";
        continuarCaja.hidden = false;
        continuarCaja.querySelector("button").onclick = function () {
          continuarCaja.hidden = true;
          var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
        };
      } else if (p.visto && siguienteDe(u.t, u.ep)) {
        cargar(u.t, u.ep + 1, false);
      }
    } else {
      cargar(1, 1, false);
    }
    if (!ultimoPublicado) cargar(1, null, false);
  }
})();
