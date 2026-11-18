# Sudcalia · Sitio web

Sitio de **Sudcalia** y sus submarcas (Ediciones, Estudios, Play, Games), con enlace a RHINOBUILD.
Es HTML estático, listo para **GitHub Pages**. Los registros de interesados se guardan en **Google Sheets** mediante **Apps Script**.

## Contenido

| Archivo | Qué es |
| --- | --- |
| `index.html` | Página principal: las cinco líneas y el registro |
| `ediciones.html` | Libros de F. C.: *El último guardián de los recuerdos* (juvenil 10+, gratis), *Dentro de mi cabeza* (terror 16+, gratis) y La Saga de los Robles Eternos (4 libros, el primero gratis) |
| `estudios.html` | Estudio de animación: adaptación de la saga (12 episodios por temporada, 16+) |
| `play.html` | Plataforma de streaming, en modo "próximamente" con acceso anticipado |
| `games.html` | Videojuegos, en modo "próximamente" con registro de beta testers |
| `libro.html` | Ficha de cada libro: portada, sinopsis, precio, botones de compra y muestra (`libro.html?libro=libro-1`) |
| `leer.html` | Lector de la muestra gratuita (`leer.html?libro=libro-1`) |
| `assets/data/libros.json` | **Los datos de la tienda**: sinopsis, frase, portada, muestra, páginas y enlaces de compra de cada libro. La saga va en `libros`; los títulos independientes, en `otros` |
| `assets/libros/` | Portadas, muestras y el archivo descargable del Libro I (ver su README) |
| `privacidad.html` | Aviso de privacidad simplificado |
| `404.html` | Página de error |
| `assets/js/config.js` | URL de Apps Script, correo de contacto y redes sociales |
| `assets/css/sudcalia.css` | Estilos con la paleta del Manual de Marca v3.0 |
| `assets/logos/` | Logotipos oficiales v4 en PNG transparente, más versiones solo con el símbolo |
| `apps-script/Code.gs` | Backend: guarda los registros en Sheets, te avisa por correo y reparte las peticiones a la tienda |
| `apps-script/Tienda.gs` | Tienda: crea el pago en Mercado Pago, verifica que se haya pagado y envía el PDF por correo |
| `gracias.html` | Página a la que vuelve el lector después de pagar; confirma el pedido |

## Puesta en marcha (unos 15 minutos)

### 1. Backend de registros (Apps Script)
1. En Google Drive, crea una hoja de cálculo llamada **Sudcalia · Registros**.
2. **Extensiones → Apps Script**. Pega el contenido de `apps-script/Code.gs`.
3. En `AJUSTES`, cambia `AVISAR_A` si quieres recibir los avisos en otro correo.
4. Ejecuta la función **`configurar`** y autoriza los permisos. Se crea la pestaña *Registros*.
5. **Implementar → Nueva implementación → Aplicación web**, con *Ejecutar como: Yo* y *Acceso: Cualquier usuario*.
6. Copia la URL que termina en `/exec`.

### 2. Configura el sitio
Abre `assets/js/config.js` y pega esa URL en `APPS_SCRIPT_URL`.
### 2b. Llena la tienda de Ediciones
Edita `assets/data/libros.json`. Por cada libro puedes llenar:
- `sinopsis`: separa los párrafos con `\n\n`. Y `frase`, una línea gancho que va bajo el título.
- `portada`: por ejemplo `assets/libros/libro-1-portada.jpg`. Mientras esté vacía, se dibuja una portada con los colores de la marca.
- `muestra`: un archivo `.md` con el primer capítulo. Si está vacío, no aparece el botón de leer la muestra.
- `enlaces`:
  - `descarga_gratis`: el EPUB o PDF del Libro I.
  - `google_play`
  - `amazon`
  - `mercado_pago`: un "link de pago" que creas en tu cuenta de Mercado Pago, para cobrar directo.

Si un libro no tiene ningún enlace, su ficha muestra "Avísame cuando salga" con el formulario de registro.

### 2c. Activa la venta con entrega automática
1. En el mismo proyecto de Apps Script crea un segundo archivo, **Tienda.gs**, y pega `apps-script/Tienda.gs`. Actualiza también **Code.gs**, porque ahora reparte las peticiones a la tienda.
2. Sube a **tu Drive** los PDF de los libros II, III y IV (sin compartirlos) y pega sus ID en `LIBROS_VENTA`, dentro de Tienda.gs.
3. En Mercado Pago: **Tu negocio → Configuración → Credenciales → Producción**. Copia el *Access Token* (`APP_USR-…`).
4. En Apps Script: **⚙ Configuración del proyecto → Propiedades del script → Agregar**: `MP_ACCESS_TOKEN` = tu token. El token nunca va en el sitio.
5. Ejecuta `instalarTienda` y autoriza los permisos.
6. **Implementar → Gestionar implementaciones → editar → Versión nueva.**

Con `APPS_SCRIPT_URL` puesto en `config.js`, los libros con `"venta_directa": true` muestran **Comprar · $99 MXN**. Cada compra aparece en la pestaña **Pedidos** con su estado: Pendiente, Pagado o Entregado. Desde el menú **Sudcalia** de la hoja puedes reenviar un libro.

**Prueba antes de cobrar de verdad:** usa el token de prueba (`TEST-…`) y una tarjeta de prueba de Mercado Pago. Cuando todo funcione, cámbialo por el de producción.

### 3. Publicación (ya hecha)
El sitio vive en la carpeta `sudcalia/` del repositorio `RHINOBUILD/rhinobuild.github.io` y se publica en **https://rhinobuild.github.io/sudcalia/**.
Para cambiar algo, edita los archivos de esa carpeta y súbelos a `main`; GitHub Pages lo publica en uno o dos minutos.

Cuando tengas el dominio (sudcalia.com o .mx), lo recomendable es mover esta carpeta a un repositorio propio (`RHINOBUILD/sudcalia`), agregar un archivo `CNAME` con el dominio y configurar el DNS como indica GitHub.

### 4. Prueba
Llena el formulario en el sitio publicado. El registro debe aparecer en la hoja y debe llegarte el correo de aviso.

## Pendientes antes de anunciarlo
- [ ] `privacidad.html`: completar **[DOMICILIO PARA OÍR Y RECIBIR NOTIFICACIONES]** y, de preferencia, pedir a un abogado que revise el aviso.
- [ ] `ediciones.html`: escribir la sinopsis de la saga (busca el comentario `SINOPSIS`).
- [ ] Portadas reales de los libros: hoy se dibujan con CSS. Puedes reemplazarlas por imágenes en `assets/img/`.
- [ ] Redes sociales en `config.js` cuando apartes @sudcalia.
- [x] Imagen para compartir en redes (`og:image`) en `ediciones.html`: portada de *Dentro de mi cabeza*.

## Notas técnicas
- Los formularios envían con `fetch` en modo `no-cors`, que es lo que permite Apps Script desde otro dominio. El sitio no puede leer la respuesta, así que muestra el mensaje de éxito si el envío no falla en la red.
- Protección contra spam: un campo oculto que los bots llenan y un límite de 3 registros por correo cada 6 horas.
- Los logotipos del sitio (`assets/logos/*.webp`) salen de los SVG oficiales v4 con fondo transparente. Los SVG completos, pensados para impresión, están en el Manual de Marca.

Creado por RHINOBUILD · una empresa Sudcalia.
