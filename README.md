# DrillotStudioIA

Recreación personal, con fines de estudio, del sitio [obys.agency](https://obys.agency), más una sección **Lab** propia para mini proyectos. React + Vite. No está afiliada a ni respaldada por Obys.

## Correr el proyecto

```bash
npm install
npm run dev
```

Queda en `http://localhost:4123`. Para el build de producción: `npm run build` y `npm run preview`.

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Home: carrusel infinito con scroll interceptado |
| `/about` | Estudio, galería y datos |
| `/favorites` | Selección destacada |
| `/favorites/:slug` | Ficha de proyecto |
| `/lab` | **Propio.** Grilla de mini proyectos a color |
| `/lab/:slug` | Ficha de un mini proyecto |

## Agregar un mini proyecto a Lab

Dos pasos, sin tocar ningún componente:

1. Poné las imágenes en `public/img/lab/<slug>/`
2. Sumá una entrada en [`src/data/labProjects.js`](src/data/labProjects.js)

```js
{
  slug: "miProyecto",
  name: "Mi Proyecto",
  category: "Ilustración",   // opcional
  year: "2026",              // opcional
  favorite: true,            // opcional: lo suma a /favorites
  cover: {
    src: "/img/lab/miProyecto/portada.jpg", w: 2848, h: 1696,
    video: "/img/lab/miProyecto/portada.mp4",   // opcional
  },
  images: [
    { src: "/img/lab/miProyecto/img1.jpg", w: 2848, h: 1696 },
  ],
}
```

Con eso el proyecto aparece en tres lugares a la vez, sin tocar nada más: **el carrusel de la home**, la grilla de `/lab` y su propia ficha en `/lab/<slug>`. La navegación anterior/siguiente también se arma sola.

En la home los proyectos de Lab van **primero**, delante de los de Obys, porque son obra propia. La numeración del carrusel se recalcula sobre la lista combinada, así que es correlativa (`01` es el primero de Lab). Cada pieza sabe a dónde lleva: las de Lab a `/lab/<slug>` y las de Obys a `/favorites/<slug>`. La grilla de `/favorites` muestra sólo lo marcado como favorito.

Esa unión vive en [`src/data/homeItems.js`](src/data/homeItems.js). Si algún día querés que la home muestre **sólo** lo tuyo, se borra el spread de `projects` de ahí y listo.

Conviene poner `w` y `h`: reservan la caja antes de que cargue la imagen y evitan que la grilla salte. Se sacan con `sips -g pixelWidth -g pixelHeight archivo.jpg`.

Para las imágenes, WebP o JPG con el lado largo en ~1600px alcanza. Las de `newArt` están en 2848px y ~1MB cada una: se ven bien pero hacen la página más pesada de lo necesario.

## Video en hover

Cualquier imagen puede llevar un `video`. Al pasar el mouse se reproduce sobre la imagen, que queda de póster; al salir, se pausa y rebobina. Un badge con un anillo que late avisa cuáles se mueven, y desaparece mientras reproduce. En touch no hay hover: ahí arranca mientras la pieza esté a la vista.

El video **no se descarga hasta que alguien lo mira**. El `src` se monta recién en la primera interacción, porque `preload="none"` solo no alcanza: varios navegadores piden igual los metadatos, y con una grilla llena eso serían muchas descargas para algo que quizá nadie mire.

Conviene que sea mudo, corto y liviano. El `portadaVideo.mp4` original pesaba 38MB, inviable para un preview; comprimido a 1280px quedó en 3.1MB:

```bash
ffmpeg -i original.mp4 -an -vf "scale=1280:-2" -c:v libx264 -crf 27 \
  -preset slow -pix_fmt yuv420p -movflags +faststart salida.mp4
```

`-an` saca el audio (no sirve en un hover), `-movflags +faststart` deja que empiece sin bajar el archivo entero.

**Dónde va cada versión.** Todo lo que está en `public/` se copia tal cual al build, así que un master pesado ahí se publica aunque nadie lo use: con el original de 38MB adentro, `dist/` pesaba 51MB en vez de 11MB. Además quedaría para siempre en el historial de git.

- `public/img/` — la versión comprimida, la que sirve el sitio. Va a git.
- `media-src/` — los masters sin comprimir. Ignorado por git y fuera del build.

Guardá ahí los originales por si algún día tenés que reexportar.

## Elegir qué va en Favorites

Cada proyecto lleva un campo `favorite`. En `true` aparece en `/favorites`; sacándolo o poniéndolo en `false` deja de estar destacado, pero **sigue existiendo**: mantiene su ficha y su lugar en el carrusel de la home.

- Proyectos de Obys: `src/data/projects.js`
- Mini proyectos propios: `src/data/labProjects.js`

```js
{ n: "03", slug: "autex", name: "Autex", ..., favorite: false }
```

La numeración de la sección se recalcula sobre la selección, así que no quedan huecos al desmarcar uno.

La sección antes se llamaba Work. Los enlaces viejos (`/work` y `/work/<slug>`) redirigen solos y conservan el proyecto.

## Arquitectura

```
src/
  main.jsx           entry: router + estilos globales
  App.jsx            rutas, cada una en su propio chunk (lazy)
  containers/
    Layout.jsx       cascarón: header, footer y modal, fuera del Outlet
  components/        presentacionales, reusables entre páginas
    Header/ Footer/ Preloader/ ContactModal/ Marks.jsx
  pages/             una carpeta por ruta, con su CSS Module al lado
  hooks/
    useCarousel      motor del carrusel de la home
    useLockBodyScroll  bloqueo de scroll con contador de consumidores
    useReveal        aparición al entrar en viewport
  data/              contenido, separado de la presentación
  styles/tokens.css  único CSS global: reset, escala fluida y variables
```

**Estilos:** CSS Modules por componente, con un solo global (`tokens.css`) para el reset, las variables y la escala tipográfica. Nada de colisiones de nombres y cada ruta descarga sólo su CSS.

**Decisiones de rendimiento:**

- Cada ruta es un `lazy()` aparte, y GSAP va en su propio chunk porque sólo lo usa la intro. Entrar a Lab no descarga el código de la home.
- El carrusel escribe los `transform` directo sobre el nodo con refs dentro del `requestAnimationFrame`. React sólo se entera cuando cambia el proyecto activo: un `useState` por frame serían 60 renders por segundo de toda la página.
- El rAF se apaga solo cuando la posición se asienta y vuelve a arrancar con el próximo input.
- Las diapositivas y las tarjetas están memoizadas: al cambiar el activo se re-renderizan las dos que cambian de estado, no las 57 del bucle.
- El header y el modal viven fuera del `Outlet`, así sobreviven a los cambios de ruta sin volver a montarse.

## Las dos mecánicas de la home

Ambas replican comportamiento medido sobre el sitio real, no una aproximación.

**Intro.** Timeline de 3.65s: el contador va de 0 a 100 mientras la marca se dibuja primero con trazo y después se rellena; luego el fondo pasa de negro a blanco y **las dos mitades de la marca se abren** hasta convertirse en el `( )` que enmarca la imagen activa. La marca del preloader y el paréntesis de la home son el mismo objeto.

Se muestra una vez por sesión. Para repetirla: `http://localhost:4123/?intro=1`.

**Scroll interceptado.** La home no scrollea de forma nativa: el `body` mide exactamente el alto del viewport, igual que el original. La rueda alimenta una posición virtual interpolada y el proyecto activo queda siempre centrado, con la lista de nombres y los metadatos en sincronía.

El bucle es infinito: se renderizan **tres copias** de los 19 proyectos y se navega la del medio, así siempre hay contenido real arriba y abajo del centro y al envolver la posición el salto es invisible. Las imágenes alternan los cinco formatos del original, no una grilla uniforme.

Al soltar el scroll encaja en el proyecto más cercano. La distancia se mide sobre el destino y no sobre la posición actual: como la posición viene interpolando, medir ahí elegiría un proyecto ya superado y se sentiría como un tirón hacia atrás.

Se navega con rueda, gesto táctil, flechas del teclado o clickeando un nombre.

## Qué es recreación y qué es propio

- **Propio:** toda la sección `/lab`, incluidas las imágenes de `newArt`.
- **Recreación:** el resto. Copy y datos son los reales del sitio; las portadas de proyecto y las fotos de About se enlazan al CDN público de Obys (`cms.obys.agency`), las mismas URLs que sirve el sitio original. No son material propio: si esto sale a algún lado, reemplazalas.
- **Tipografía:** el original usa una fuente propietaria (`OTF Obys NG`) que no se puede redistribuir. Se usa **General Sans** (Fontshare) como sustituto.
- **Fichas de proyecto:** no se inventó contenido de caso de estudio. Cada una dice qué es y enlaza al caso real en obys.agency.
- **Reloj del header:** el sitio real muestra la hora del estudio. Acá se quitó a pedido.
- **Vista Horizontal** del toggle y las constantes de velocidad e interpolación del scroll: interpretación propia. La mecánica sí está medida del original; esos números concretos se ajustaron a ojo.

## Transición al abrir un proyecto

Al entrar a un proyecto desde el carrusel (click en la imagen o puño), la imagen sale de la diapositiva, crece hasta llenar la pantalla con un leve zoom de cámara mientras el resto de la home se va (los vecinos se apagan, la lista se corre, el paréntesis se abre hacia afuera), y después baja hasta posarse exactamente sobre la portada del proyecto. El título entra palabra por palabra desde abajo mientras la imagen aterriza. Son unos 2.2 s en total.

- [`src/transitions/projectTransition.js`](src/transitions/projectTransition.js): `openProject` (en la home) y `landProject` (en la página del proyecto). La capa que viaja es un nodo en `<body>` fuera de React, así sobrevive al cambio de ruta.
- [`src/transitions/geometry.js`](src/transitions/geometry.js): en cada frame se interpola la ventana visible (`clip-path`) y se recalcula el cover de la imagen (`transform`). Así nunca aparece un borde vacío ni la imagen deformada. Sólo `transform` y `clip-path`: nada de layout.
- [`src/hooks/useProjectEntrance.js`](src/hooks/useProjectEntrance.js) + [`SplitWords`](src/components/SplitWords/SplitWords.jsx): entrada del título y los metadatos. Corre también cuando se entra sin transición (desde Lab o el paginador), sin la imagen viajera.
- Curvas en [`src/transitions/eases.js`](src/transitions/eases.js): `pt-out` es la misma que `--ease-obys`; `pt-in-out` es un ease-in-out fuerte para la imagen que se mueve.

Cmd/ctrl-click sigue abriendo en otra pestaña. Con `prefers-reduced-motion` no hay viaje ni movimiento: se navega directo y el contenido está visible desde el primer frame. Mientras la imagen viaja, la rueda y las manos no mueven nada.

Duraciones y zoom: `LEAVE_DURATION`, `LAND_DURATION` y `PEAK_ZOOM` al principio de `projectTransition.js`.

## Control con las manos (MediaPipe)

En la home se puede navegar el carrusel con la mano frente a la cámara:

| Gesto | Qué hace |
|---|---|
| Mano abierta, subirla o bajarla | Scrollea entre proyectos (en vista horizontal, moverla a los costados) |
| Puño sostenido ~0.5 s | Entra al proyecto activo |
| Sacar la mano o cerrarla | El carrusel se acomoda en el proyecto más cercano |

Se prende con el botón **Hands** de la barra inferior o con la tecla **H**. Queda recordado durante la sesión, así al entrar a un proyecto y volver sigue activo. `/?hands` en la URL lo prende de entrada, útil para presentar. Abajo a la derecha aparece la cámara con la mano dibujada y el progreso del puño.

La cámara pide permiso y sólo funciona en `localhost` o HTTPS. No es para mobile: el HUD y el botón se ocultan debajo de 900px.

**Para presentar sin internet**, bajar el modelo una vez:

```bash
npm run hands:model
```

Queda en `public/models/gesture_recognizer.task` (~8MB, fuera de git). Sin él, el sitio lo pide al bucket oficial de Google la primera vez que se activan las manos. El runtime WASM ya viene de `node_modules` y entra al build, así que no depende de ningún CDN. Nada de MediaPipe se descarga hasta que alguien prende las manos.

### Cómo está armado

- [`src/gestures/handGestures.js`](src/gestures/handGestures.js): lógica pura, de landmarks a acciones. Detecta el puño con el clasificador de MediaPipe (`Closed_Fist`) y, cuando el clasificador no opina, por geometría (punta del dedo más cerca de la muñeca que el nudillo, en 3 de 4 dedos). El scroll sigue el centro de la palma, que no se mueve al cerrar la mano, así el puño no se lee como scroll.
- [`src/gestures/recognizer.js`](src/gestures/recognizer.js): carga el `GestureRecognizer` (GPU, con fallback a CPU).
- [`src/hooks/useHandControl.js`](src/hooks/useHandControl.js): cámara, bucle por frame y HUD. Como el carrusel, no pasa por React en cada frame.
- `useCarousel` expone `scrollBy` y `release`: la mano entra por el mismo camino que la rueda y el touch.

Ajustes finos: `HAND_GAIN` en [`Home.jsx`](src/pages/Home/Home.jsx) (cuánto scrollea la mano) y `DEFAULTS` en `handGestures.js` (tiempo del puño, zona muerta, suavizado).

### Tests y eval

```bash
npm test               # 27 tests (gestos + geometría de la transición), <1 s
npm run eval:gestures  # barrido de miles de manos sintéticas con umbrales
```

El eval mide precisión de pose con rotación, escala y ruido; scroll fantasma con la mano quieta; dirección del scroll; y que un puño corto nunca entre. Usa manos sintéticas ([`fixtures.js`](src/gestures/fixtures.js)), no grabaciones reales.

En desarrollo, `window.__handControl.feed(frame)` inyecta frames sin cámara para probar el flujo completo en el navegador.
