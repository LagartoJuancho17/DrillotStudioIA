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

- **`index.html`** — home: intro animada + carrusel infinito con scroll interceptado (ver abajo), header con reloj en vivo (hora de Ámsterdam), selector de vista Vertical/Horizontal/Grid, modal de contacto.

### Las dos mecánicas que definen la home

Ambas replican el comportamiento medido sobre el sitio real, no una aproximación:

**1. Intro (`js/site.js` → `runPreloader`).** Timeline de GSAP de 3.65s: el contador va de 0 a 100 mientras la marca se dibuja primero solo con trazo y después se rellena; luego el fondo pasa de negro a blanco, la marca invierte a negro y **sus dos mitades se abren hacia los costados** hasta convertirse en el `( )` que enmarca la imagen activa. La marca del preloader y el paréntesis de la home son el mismo objeto: uno se transforma en el otro.

Para volver a verla sin limpiar `sessionStorage`: `http://localhost:4123/?intro=1`. Sin ese parámetro se muestra una vez por sesión (igual que el sitio real) y respeta `prefers-reduced-motion`.

**2. Scroll interceptado (`js/home.js`).** La home **no scrollea de forma nativa**: el `body` mide exactamente el alto del viewport, igual que el original. El `wheel`/`touch` alimenta una posición virtual con interpolación que desplaza la tira de imágenes, y el proyecto activo queda **siempre centrado**. En sincronía se mueven la lista de nombres y la fila de metadatos (categoría / servicios / número).

El bucle es infinito: se renderizan **tres copias** de los 19 proyectos y se navega sobre la del medio, así siempre hay contenido real arriba y abajo del centro y al envolver la posición el salto es invisible. Las imágenes alternan los cinco formatos del sitio original (`aspect-ratio` y ancho en ciclo), no una grilla uniforme.

Se puede navegar con rueda, gesto táctil, flechas del teclado o haciendo click en un nombre de la lista (va por el camino más corto del anillo).
- **`about.html`** — founders, copy real del sitio, galería editorial de 21 fotos del estudio, columnas de datos (servicios, industrias, premios, charlas, prensa).
- **`work.html`** — grid con los 19 proyectos reales listados en el sitio.
- **`work/project.html?slug=<slug>`** — plantilla única reutilizada para las 19 páginas de proyecto (hero, imagen, navegación prev/next con wraparound).

## Decisiones y desvíos honestos respecto al sitio real

- **Tipografía**: el sitio real usa una fuente propietaria (`OTF Obys NG` / `ObysSans4.woff2`) que no se puede redistribuir. Se usa **General Sans** (Fontshare, gratuita) como sustituto visual más cercano.
- **Imágenes**: se enlazan directo al CDN público del estudio (`cms.obys.agency`) — son las mismas URLs que sirve el sitio original, no se copió ni redistribuyó ningún archivo.
- **Marca "( )"** y wordmark "OBYS®": se recrearon con los mismos paths SVG que usa el sitio real (geometría pura, sin tipografía embebida).
- **Páginas de proyecto**: no investigué el diseño real de las 19 case studies individuales (fuera de alcance). La plantilla usa los datos reales (categoría, servicios, número, imagen de portada) y linkea honestamente a la case study real en obys.agency en vez de inventar contenido de cliente falso.
- **Vista "Horizontal"** del toggle: usa el mismo motor de scroll interceptado sobre el eje X. Es interpretación propia — no capturé el comportamiento exacto del sitio real en ese estado.
- **Constantes de scroll** (velocidad de rueda, factor de interpolación): ajustadas a ojo para que se sienta parecido. La *mecánica* (intercepción, bucle de 3 copias, activo centrado, formatos en ciclo) sí está medida del sitio real; estos números concretos no.
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
