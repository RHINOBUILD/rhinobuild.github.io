# Tortuga del Cortés · Sudcalia Games

Primer juego de Sudcalia Games. Es un arcade para celular: la tortuga nada de Loreto a El Arco de Cabo San Lucas, come medusas y esquiva el plástico, las redes, los tiburones y los anzuelos.

**Jugar:** https://rhinobuild.github.io/sudcalia/games/tortuga-del-cortes/

## Cómo se juega
- Mantén presionada la pantalla (o la barra espaciadora o la flecha ↑) para subir y suelta para bajar.
- **Modo historia:** 5 tramos de 1,000 m: Loreto → Isla Espíritu Santo → Cabo Pulmo → San José del Cabo → Cabo San Lucas. Cada tramo tiene su paisaje y agrega un peligro nuevo. Al llegar a El Arco se gana el juego (+500 y +100 por cada vida que quede).
- **Modo infinito:** sin final; los tramos se repiten cada vez más rápido.
- Medusa +10 · concha dorada +50 · corazón +1 vida (máximo 5) · +250 por cada tramo.
- Los récords y el silencio se guardan en el navegador del jugador.

## Archivos
| Archivo | Qué es |
| --- | --- |
| `index.html` | El juego completo (canvas, sin librerías) |
| `manifest.webmanifest` | Datos para instalarlo como app (pantalla completa, vertical) |
| `sw.js` | Guarda el juego en caché para jugar sin conexión. **Al publicar cambios, sube la versión de `CACHE`** |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Íconos de la app |
| `portada.png` | Imagen para redes sociales (1200×630) |

El logotipo se toma de `../../assets/logos/games-simbolo.png`.

## Publicar en Google Play
El juego ya es una PWA, así que se empaqueta como **TWA** (Trusted Web Activity) sin reescribirlo:

1. Entra a https://www.pwabuilder.com, pega la URL del juego y elige **Android → Generate package**.
   - Package ID sugerido: `org.rhinobuild.sudcalia.tortuga`
   - App name: `Tortuga del Cortés` · Launcher name: `Tortuga`
   - Display mode: `Fullscreen` · Orientación: `Portrait`
2. Descarga el ZIP. Trae el `.aab` (para subir a Play), la llave de firma (**guárdala bien, sin ella no podrás actualizar la app**) y un `assetlinks.json`.
3. Sube `assetlinks.json` a `https://rhinobuild.github.io/.well-known/assetlinks.json` (carpeta `.well-known/` en la raíz de este repo). Así Android abre el juego sin barra de navegador.
4. En Google Play Console (cuenta de desarrollador, pago único de 25 USD): crea la app, sube el `.aab` a **Prueba interna**, llena la ficha (descripción, capturas, `icon-512.png`, clasificación de contenido: apto para todos) y la política de privacidad (`https://rhinobuild.github.io/sudcalia/privacidad.html`).
5. Las cuentas personales nuevas necesitan una **prueba cerrada con al menos 12 testers durante 14 días** antes de publicar en producción: usa la lista de beta testers de `games.html`.

Creado por RHINOBUILD.
