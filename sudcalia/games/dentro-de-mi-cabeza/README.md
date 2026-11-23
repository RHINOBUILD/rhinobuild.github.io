# Dentro de mi cabeza · Sudcalia Games

Quinto juego de Sudcalia Games. Es una aventura de terror psicológico en primera persona (3D) basada en el primer cuento del libro *Dentro de mi cabeza* de F. C. (Sudcalia Ediciones). Clasificación: 16+.

**Jugar:** https://rhinobuild.github.io/sudcalia/games/dentro-de-mi-cabeza/

## Cómo se juega
- **Computadora:** `WASD` caminar, ratón mirar, `E` o clic interactuar, `F` linterna, `Shift` correr y `Esc` pausa.
- **Celular** (mejor en horizontal): la mitad izquierda de la pantalla sirve para caminar y la derecha para mirar. Los botones **ACCIÓN** y **LUZ** están abajo a la derecha.
- Se recomienda jugar con audífonos: el crujido se ubica en 3D y hay que seguirlo con el oído.

## Estructura (sigue las partes del cuento)
1. **El sonido:** despiertas a las 3:17, tomas el celular y sigues el crujido (techo → pared → espejo del baño → debajo de la cama → adentro). Enciendes la luz del baño, te mojas la cara y te miras en el espejo: el reflejo parpadea, pero no al mismo tiempo que tú.
2. **Fisuras:** el reflejo se queda mirándote, la nota en la laptop (15:17), el rasguño en la pared, la cinta métrica (17 cm), el cuchillo y la voz.
3. **El otro lado:** la habitación blanca, el espejo que no te refleja, el doble y el cruce al otro lado del vidrio.
4. **Epílogo · Voz baja:** tu cuerpo vive sin ti detrás de un vidrio empañado; te deja moverte unos segundos… y luego no.

Dura entre 12 y 15 minutos.

## Técnica
- HTML5 + Three.js r160, incluido en `lib/` para que funcione sin CDN y sin conexión (`sw.js`).
- El espejo es un `Reflector`. El doble solo se dibuja dentro del reflejo (ver `hookMirror` en `index.html`).
- Todo el sonido (crujidos, rasguños, latido, susurros) se genera con Web Audio; no hay archivos de audio. Las frases del doble usan la voz del sistema (se puede apagar en la pantalla de inicio).
- El guion está en `index.html`, en las funciones `act1`, `act2`, `act3` y `epilogue`. Los textos se pueden editar ahí.
- Para probar escenas sueltas, abre `index.html#dev` y en la consola usa `__dmc.skipTo(2)`, `__dmc.skipTo(3)` o `__dmc.skipTo(4)`.
- Se instala como app (`manifest.webmanifest`). Para Google Play se puede empaquetar igual que los otros juegos (TWA o Capacitor).
