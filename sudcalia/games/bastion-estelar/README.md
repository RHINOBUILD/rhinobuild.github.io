# Bastión Estelar · Sudcalia Games

Cuarto juego de Sudcalia Games y el más complejo. Es un juego de estrategia de defensa de torres para celular: los invasores avanzan por un camino y hay que construir y mejorar torres para que no lleguen al núcleo.

**Jugar:** https://rhinobuild.github.io/sudcalia/games/bastion-estelar/

## Cómo se juega
- Toca una casilla vacía para elegir una torre y construirla. Toca una torre para mejorarla, venderla (devuelve el 70 % de lo invertido) o cambiar a qué enemigo apunta.
- Pulsa **▶ OLEADA** para mandar la siguiente oleada. Si la llamas antes de que termine la anterior, ganas créditos extra.
- El núcleo tiene 20 vidas. Cada invasor que llega resta vidas: 1 los normales, 2 el Blindado y 5 los jefes.
- Se puede pausar y jugar a velocidad ×1, ×2 o ×3.
- Teclado (opcional): `Espacio` llama la oleada, `1`–`4` construye, `U` mejora, `F` cambia la velocidad, `P` pausa y `M` silencia.

### Torres (3 niveles cada una)
| Torre | Costo | Para qué sirve |
| --- | --- | --- |
| Láser | 50 | Dispara muy rápido a un objetivo. Pierde mucha fuerza contra el blindaje |
| Cañón | 80 | Proyectil lento que explota y daña en área |
| Crio | 70 | Pulso que daña poco pero frena a todos los enemigos cercanos |
| Tesla | 120 | Rayo que salta entre varios enemigos e ignora el blindaje |

### Invasores
Dron (normal), Veloz (rápido y débil), Blindado (lento, resta daño a cada golpe), Enjambre (llega en grupos grandes), Regenerador (recupera vida con el tiempo) y Jefe (cada 5 oleadas, mucha vida).

### Sectores
| Sector | Oleadas | Dificultad | Créditos iniciales |
| --- | --- | --- | --- |
| 1 · Órbita baja | 15 | ×1.0 | 120 |
| 2 · Cinturón de asteroides | 20 | ×1.3 | 140 |
| 3 · Núcleo galáctico | 25 | ×1.6 | 160 |

Cada sector se abre al ganar el anterior. Al ganar, las estrellas dependen de las vidas que queden en el núcleo: 3 estrellas con 18 o más, 2 con 10 o más y 1 con menos. Las estrellas y los récords se guardan en el navegador del jugador.

## Ajustar la dificultad
Todo está en `index.html`:
- `TOWERS`: costo, mejoras, daño, cadencia, alcance y efectos de cada torre.
- `ENEMIES`: vida, velocidad, recompensa, blindaje y cuántas vidas quita cada invasor.
- `MAPS`: camino (puntos en la cuadrícula de 9×12), número de oleadas, multiplicador de dificultad y créditos iniciales.
- `waveInfo()`: qué enemigos trae cada oleada y cuánto crece su vida.

El equilibrio se probó con partidas simuladas por un jugador automático. Con una buena mezcla de torres se ganan los tres sectores, aunque el tercero cuesta vidas. Usar un solo tipo de torre pierde en los sectores 2 y 3.

## Archivos
| Archivo | Qué es |
| --- | --- |
| `index.html` | El juego completo (canvas, sin librerías) |
| `manifest.webmanifest` | Datos para instalarlo como app (pantalla completa, vertical) |
| `sw.js` | Guarda el juego en caché para jugar sin conexión. **Al publicar cambios, sube la versión de `CACHE`** |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Íconos de la app |
| `portada.png` | Imagen para redes sociales (1200×630) |

## Publicar en Google Play
Igual que *Tortuga del Cortés* (ver `../tortuga-del-cortes/README.md`), con estos datos en PWABuilder:
- Package ID sugerido: `org.rhinobuild.sudcalia.bastion`
- App name: `Bastión Estelar` · Launcher name: `Bastión`
- Display mode: `Fullscreen` · Orientación: `Portrait`

Creado por RHINOBUILD.
