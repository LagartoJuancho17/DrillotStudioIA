# Obys Agency — recreación

Recreación personal, con fines de estudio, del sitio [obys.agency](https://obys.agency). HTML/CSS/JS vanilla, sin build step. No está afiliada a ni respaldada por Obys.

## Correr el sitio

Necesita servirse por HTTP (usa `fetch()` para los partials de header/footer/preloader — no funciona abriendo los `.html` directo con `file://`).

```bash
cd /Users/tobiasarraiza/obys-agency-clone
python3 -m http.server 4123
```

Luego abrir `http://localhost:4123`.

## Qué incluye

- **`index.html`** — home: preloader animado, header con reloj en vivo (hora de Ámsterdam), lista de trabajos con hover que actualiza una "film strip" central y una fila de categoría/servicios/número, selector de vista Vertical/Horizontal/Grid, modal de contacto.
- **`about.html`** — founders, copy real del sitio, galería editorial de 21 fotos del estudio, columnas de datos (servicios, industrias, premios, charlas, prensa).
- **`work.html`** — grid con los 19 proyectos reales listados en el sitio.
- **`work/project.html?slug=<slug>`** — plantilla única reutilizada para las 19 páginas de proyecto (hero, imagen, navegación prev/next con wraparound).

## Decisiones y desvíos honestos respecto al sitio real

- **Tipografía**: el sitio real usa una fuente propietaria (`OTF Obys NG` / `ObysSans4.woff2`) que no se puede redistribuir. Se usa **General Sans** (Fontshare, gratuita) como sustituto visual más cercano.
- **Imágenes**: se enlazan directo al CDN público del estudio (`cms.obys.agency`) — son las mismas URLs que sirve el sitio original, no se copió ni redistribuyó ningún archivo.
- **Marca "( )"** y wordmark "OBYS®": se recrearon con los mismos paths SVG que usa el sitio real (geometría pura, sin tipografía embebida).
- **Páginas de proyecto**: no investigué el diseño real de las 19 case studies individuales (fuera de alcance). La plantilla usa los datos reales (categoría, servicios, número, imagen de portada) y linkea honestamente a la case study real en obys.agency en vez de inventar contenido de cliente falso.
- **Vista "Horizontal"** del toggle: interpretación propia — no tuve forma de capturar el comportamiento exacto del sitio real en ese estado.
- **Escala tipográfica fluida**: replica la técnica real (`html { font-size: 0.6944vw }`, 1rem = 10px sobre un lienzo de diseño de 1440px), medida directamente del sitio original.

## Estructura

```
css/base.css         reset + escala tipográfica fluida + tokens de color
css/components.css   header, footer, preloader, modal de contacto, menú mobile
css/home.css         layout de la home
css/about.css        layout de about
css/work.css         grid de trabajos
css/project.css      plantilla de proyecto
js/site.js           boot compartido: partials, reloj, modal, menú, preloader
js/svg-marks.js       paths SVG de la wordmark y la marca "( )"
js/data-projects.js  datos de los 19 proyectos (nombre, categoría, servicios, imagen)
js/home.js / about.js / work.js / project.js   interacción específica de cada página
partials/            header.html, footer.html, preloader.html (inyectados vía fetch)
```
