# Archivos de los libros

Pon aquí las portadas y las muestras. Después escribe la ruta en `assets/data/libros.json`.

## Portadas
- Formato JPG o WebP en proporción 2:3 (por ejemplo, 800 × 1200 px), de menos de 300 KB.
- Nombre sugerido: `libro-1-portada.jpg`, `libro-2-portada.jpg`, etc.
- En `libros.json`: `"portada": "assets/libros/libro-1-portada.jpg"`

## Muestras de lectura
- Archivo de texto `.md`, por ejemplo `libro-1-muestra.md`.
- Formato sencillo:
  - `# Capítulo 1` para un título.
  - Separa los párrafos con una línea en blanco.
  - `*cursiva*` y `**negrita**`.
  - `* * *` en una línea sola para un cambio de escena.
- En `libros.json`: `"muestra": "assets/libros/libro-1-muestra.md"`
- Recomendación: el primer capítulo o las primeras 10 a 15 páginas.

## Libro gratis para descargar (opcional)
- Puedes poner aquí el PDF o EPUB del Libro I, por ejemplo `libro-1.epub`.
- En `libros.json`: `"descarga_gratis": "assets/libros/libro-1.epub"`
