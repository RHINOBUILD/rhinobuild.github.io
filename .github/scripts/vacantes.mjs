/**
 * Bolsa de Trabajo · Saint Luke's Hospitals
 * Genera una página fija por vacante abierta (/vacantes/ID/) con su ficha JobPosting
 * para Google for Jobs, y el sitemap de vacantes. Lo ejecuta GitHub Actions cada hora.
 *
 * Fuente: el ATS (acción vacantes_web). Si el ATS no responde, no cambia nada.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://script.google.com/macros/s/AKfycbzY_9Wb7GkB4hNJpe571PqTnNsvK7ZX5SmaYVm49Q621PD-zVgCxOkDzftVj__TD3Q9/exec';
const SITE = 'https://rhinobuild.github.io';
const BASE = '/vacantes/';
const DIR = path.resolve(process.argv[2] || 'vacantes');
const MARCA = 'data-generado="vacante"';

/* ---------- Utilidades (mismas reglas que la página) ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vin = t => String(t || '').split(/\r?\n|\s+·\s+/).map(x => x.trim()).filter(Boolean);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const idOk = id => /^[A-Za-z0-9_-]{1,40}$/.test(id);

function adaptar(v) {
  const req = vin(v.requisitos);
  return Object.assign({}, v, {
    tipo: String(v.jornada || ''),
    requisitos: req.length > 1 ? req.map(x => '- ' + x).join('\n') : (req[0] || ''),
    ubicaciones: v.ubicaciones || []
  });
}

function bloque(txt) {
  if (!txt) return '';
  const out = []; let ul = [];
  const cerrar = () => { if (ul.length) { out.push('<ul>' + ul.join('') + '</ul>'); ul = []; } };
  txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const m = l.match(/^[-•*·]\s*(.+)/);
    if (m) ul.push('<li>' + esc(m[1]) + '</li>'); else { cerrar(); out.push('<p>' + esc(l) + '</p>'); }
  });
  cerrar();
  return out.join('');
}

function chips(v) {
  const c = [];
  if (v.sede) c.push(`<span class="chip"><i class="fa-solid fa-location-dot"></i>${esc(v.sede)}</span>`);
  if (v.tipo) c.push(`<span class="chip"><i class="fa-solid fa-file-signature"></i>${esc(v.tipo)}</span>`);
  return c.join('');
}

function cuerpo(v) {
  const u = v.ubicaciones[0] || {};
  const sec = (icono, titulo, html) => `<section><h2><i class="fa-solid ${icono}"></i>${titulo}</h2>${html}</section>`;
  return (v.descripcion ? sec('fa-briefcase-medical', 'Sobre el puesto', bloque(v.descripcion)) : '') +
    (v.requisitos ? sec('fa-list-check', 'Requisitos', bloque(v.requisitos)) : '') +
    sec('fa-location-dot', 'Ubicación', v.ubicaciones.length > 1
      ? '<ul>' + v.ubicaciones.map(x => '<li>' + esc([x.localidad, x.estado].filter(Boolean).join(', ')) + '</li>').join('') + '</ul>'
      : `<p>${esc([u.calle, u.localidad || v.sede, u.estado].filter(Boolean).join(', '))}</p>`);
}

function jobPosting(v, org) {
  const j = norm(v.tipo || '');
  const tipo = /completo/.test(j) ? 'FULL_TIME' : /medio/.test(j) ? 'PART_TIME' : /temporal/.test(j) ? 'TEMPORARY'
    : /honorarios/.test(j) ? 'CONTRACTOR' : /practicas|servicio social/.test(j) ? 'INTERN' : '';
  const html = [
    v.descripcion && '<p><b>Sobre el puesto</b></p>' + bloque(v.descripcion),
    v.requisitos && '<p><b>Requisitos</b></p>' + bloque(v.requisitos)
  ].filter(Boolean).join('');
  const lugares = (v.ubicaciones.length ? v.ubicaciones : [{ localidad: v.sede }]).map(x => ({
    '@type': 'Place',
    address: Object.assign({ '@type': 'PostalAddress', addressCountry: x.pais || 'MX' },
      x.calle ? { streetAddress: x.calle } : {}, (x.localidad || !x.estado) ? { addressLocality: x.localidad || v.sede } : {},
      x.estado ? { addressRegion: x.estado } : {}, x.cp ? { postalCode: x.cp } : {})
  }));
  const d = {
    '@context': 'https://schema.org/', '@type': 'JobPosting',
    title: v.puesto,
    description: html || v.puesto,
    identifier: { '@type': 'PropertyValue', name: org.nombre, value: v.id },
    datePosted: v.publicada,
    hiringOrganization: Object.assign({ '@type': 'Organization', name: v.empresa || org.nombre },
      org.url ? { sameAs: org.url } : {}, org.logo ? { logo: org.logo } : {}),
    jobLocation: lugares.length === 1 ? lugares[0] : lugares,
    directApply: true,
    url: SITE + BASE + v.id + '/'
  };
  if (v.vigente) d.validThrough = v.vigente + 'T23:59:59';
  if (tipo) d.employmentType = tipo;
  return d;
}

/* ---------- Página por vacante ---------- */
function pagina(tpl, v, org) {
  const url = SITE + BASE + v.id + '/';
  const titulo = `${v.puesto} · ${v.sede} | Bolsa de Trabajo ${org.nombre}`;
  const desc = (v.descripcion || `Vacante de ${v.puesto} en ${v.sede}. Postúlate en línea.`).replace(/\s+/g, ' ').slice(0, 158);
  const ld = JSON.stringify(jobPosting(v, org)).replace(/</g, '\\u003c');
  let s = tpl;
  const rep = (re, val) => { if (!re.test(s)) throw new Error('No se encontró en la plantilla: ' + re); s = s.replace(re, val); };
  rep(/<html lang="es-MX">/, `<html lang="es-MX" ${MARCA}>`);
  rep(/<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`);
  rep(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  rep(/<link rel="canonical" id="canonical" href="">/, `<link rel="canonical" id="canonical" href="${url}">`);
  rep(/<meta property="og:title" id="ogTitle" content="[^"]*">/, `<meta property="og:title" id="ogTitle" content="${esc(v.puesto + ' · ' + v.sede)}">`);
  rep(/<meta property="og:description" id="ogDesc" content="[^"]*">/, `<meta property="og:description" id="ogDesc" content="${esc(desc)}">`);
  rep(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  rep(/<\/head>/, `<script type="application/ld+json" data-jobposting="1">${ld}</script>\n</head>`);
  // Vista de detalle ya dibujada (la página la vuelve a dibujar con datos en vivo)
  rep(/<a class="btn btn-primary btn-sm" href="\/vacantes\/#vacantes" id="btnTop">/, '<a class="btn btn-primary btn-sm" href="/vacantes/#vacantes" id="btnTop" hidden>');
  rep(/<main id="vistaLista">/, '<main id="vistaLista" hidden>');
  rep(/<main id="vistaDetalle" class="view" hidden>/, '<main id="vistaDetalle" class="view">');
  rep(/<span class="kicker" id="dKicker"><\/span>/, `<span class="kicker" id="dKicker">${esc([v.area, v.empresa].filter(Boolean).join(' · ') || 'Vacante')}</span>`);
  rep(/<h1 id="dPuesto"><\/h1>/, `<h1 id="dPuesto">${esc(v.puesto)}</h1>`);
  rep(/<div class="meta" id="dMeta"><\/div>/, `<div class="meta" id="dMeta">${chips(v)}</div>`);
  rep(/<div class="panel info" id="dCuerpo"><\/div>/, `<div class="panel info" id="dCuerpo">${cuerpo(v)}</div>`);
  return s;
}

function sitemap(vacs) {
  const u = (loc, last, pri) => `  <url><loc>${loc}</loc>${last ? `<lastmod>${last}</lastmod>` : ''}<priority>${pri}</priority></url>`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [u(SITE + BASE, vacs.map(v => v.publicada).sort().pop() || '', '0.8')]
      .concat(vacs.map(v => u(SITE + BASE + v.id + '/', v.publicada, '0.7'))).join('\n') + '\n</urlset>\n';
}

/* ---------- Principal ---------- */
async function main() {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'vacantes_web' }), redirect: 'follow' });
  const data = await r.json();
  if (!data.ok || !Array.isArray(data.vacantes)) throw new Error('El ATS no respondió bien: ' + JSON.stringify(data).slice(0, 200));
  const org = Object.assign({ nombre: "Saint Luke's Hospitals" }, data.org || {});
  const vacs = data.vacantes.map(adaptar).filter(v => idOk(v.id) && v.puesto);

  const tpl = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  const vigentes = new Set();
  for (const v of vacs) {
    const carpeta = path.join(DIR, v.id);
    fs.mkdirSync(carpeta, { recursive: true });
    const html = pagina(tpl, v, org);
    const f = path.join(carpeta, 'index.html');
    if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== html) fs.writeFileSync(f, html);
    vigentes.add(v.id);
  }
  // Borra páginas de vacantes que ya no están abiertas (solo carpetas generadas por este script)
  for (const d of fs.readdirSync(DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || vigentes.has(d.name)) continue;
    const f = path.join(DIR, d.name, 'index.html');
    if (fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes(MARCA)) {
      fs.rmSync(path.join(DIR, d.name), { recursive: true });
      console.log('Cerrada:', d.name);
    }
  }
  fs.writeFileSync(path.join(DIR, 'sitemap.xml'), sitemap(vacs));
  console.log(`${vacs.length} vacantes publicadas: ${[...vigentes].join(', ')}`);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
