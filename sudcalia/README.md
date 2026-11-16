# Sudcalia · Sitio web

Sitio de **Sudcalia** y sus submarcas (Ediciones, Estudios, Play, Games), con enlace a RHINOBUILD.
Es HTML estático, listo para **GitHub Pages**. Los registros de interesados se guardan en **Google Sheets** mediante **Apps Script**.

## Contenido

| Archivo | Qué es |
| --- | --- |
| `index.html` | Página principal: las cinco líneas y el registro |
| `ediciones.html` | La Saga de los Robles Eternos: 4 libros, el primero gratis |
| `estudios.html` | Estudio de animación: adaptación de la saga (12 episodios por temporada, 16+) |
| `play.html` | Plataforma de streaming, en modo "próximamente" con acceso anticipado |
| `games.html` | Videojuegos, en modo "próximamente" con registro de beta testers |
| `privacidad.html` | Aviso de privacidad simplificado |
| `404.html` | Página de error |
| `assets/js/config.js` | **El único archivo que tienes que editar**: URL de Apps Script, enlaces de los libros, redes |
| `assets/css/sudcalia.css` | Estilos con la paleta del Manual de Marca v3.0 |
| `assets/logos/` | Logotipos oficiales v4 en WebP transparente, más versiones solo con el símbolo |
| `apps-script/Code.gs` | Backend: guarda los registros en Sheets y te avisa por correo |

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
Cuando tengas enlaces de venta de los libros, pégalos en `LIBROS`. Mientras un enlace esté vacío, su botón muestra "Próximamente" y lleva al registro.

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
- [ ] Imagen para compartir en redes (`og:image`) cuando tengas un arte de portada.

## Notas técnicas
- Los formularios envían con `fetch` en modo `no-cors`, que es lo que permite Apps Script desde otro dominio. El sitio no puede leer la respuesta, así que muestra el mensaje de éxito si el envío no falla en la red.
- Protección contra spam: un campo oculto que los bots llenan y un límite de 3 registros por correo cada 6 horas.
- Los logotipos del sitio (`assets/logos/*.webp`) salen de los SVG oficiales v4 con fondo transparente. Los SVG completos, pensados para impresión, están en el Manual de Marca.

Creado por RHINOBUILD · una empresa Sudcalia.
