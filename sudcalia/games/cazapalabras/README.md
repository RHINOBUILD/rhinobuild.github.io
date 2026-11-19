# Cazapalabras · Sudcalia Games

Tercer juego de Sudcalia Games. Es una sopa de letras en cinco rondas. Cada partida elige 5 temas al azar entre 8: Animales, Frutas, Deportes, Países, Profesiones, En la cocina, El espacio y Colores.

**Jugar:** https://rhinobuild.github.io/sudcalia/games/cazapalabras/

## Cómo se juega
- Arrastra el dedo (o el ratón) sobre las letras para marcar una palabra de la lista.
- La dificultad sube en cada ronda: primero las palabras van en horizontal y vertical; luego también en diagonal, y en las dos últimas rondas, al revés.
- Cada palabra da 100 puntos más 10 por letra. Al terminar la ronda se suma un bono por rapidez (2 puntos por cada segundo por debajo de 3 minutos).
- **Pista:** hace parpadear la primera letra de una palabra (cuesta 30 puntos). **Reiniciar ronda:** arma una sopa nueva y descuenta lo ganado en esa ronda.
- Cada partida arma sopas distintas al azar. El récord y el silencio se guardan en el navegador del jugador.

## Cambiar o agregar palabras
Las listas están en `index.html`, en la constante `CATS`. Cada categoría tiene `name`, `sub` y `words`. Escribe las palabras con acentos y espacios (por ejemplo `'Pingüino'` o `'Lobo marino'`): el juego los quita solo en la cuadrícula. Las palabras de más de 10 letras se ignoran, porque la cuadrícula es de 10×10. Cada categoría necesita al menos 8 palabras. Para cambiar cuántas rondas tiene una partida, edita `ROUNDS`.

## Archivos
| Archivo | Qué es |
| --- | --- |
| `index.html` | El juego completo (HTML y CSS, sin librerías) |
| `manifest.webmanifest` | Datos para instalarlo como app (pantalla completa, vertical) |
| `sw.js` | Guarda el juego en caché para jugar sin conexión. **Al publicar cambios, sube la versión de `CACHE`** |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Íconos de la app |
| `portada.png` | Imagen para redes sociales (1200×630) |

El logotipo se toma de `../../assets/logos/games-simbolo.png`.

## Publicar en Google Play
Igual que *Tortuga del Cortés* (ver `../tortuga-del-cortes/README.md`), con estos datos en PWABuilder:
- Package ID sugerido: `org.rhinobuild.sudcalia.cazapalabras`
- App name: `Cazapalabras` · Launcher name: `Cazapalabras`
- Display mode: `Fullscreen` · Orientación: `Portrait`

Si ya existe `/.well-known/assetlinks.json` en la raíz del repo, agrega la entrada de este paquete a la misma lista en lugar de reemplazar el archivo.

Creado por RHINOBUILD.
