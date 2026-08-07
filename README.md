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
| `/work` | Índice de los 19 proyectos |
| `/work/:slug` | Ficha de proyecto |
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
  cover: { src: "/img/lab/miProyecto/portada.jpg", w: 2848, h: 1696 },
  images: [
    { src: "/img/lab/miProyecto/img1.jpg", w: 2848, h: 1696 },
  ],
}
```

Con eso el proyecto aparece en tres lugares a la vez, sin tocar nada más: **el carrusel de la home**, la grilla de `/lab` y su propia ficha en `/lab/<slug>`. La navegación anterior/siguiente también se arma sola.

En la home los proyectos de Lab van **primero**, delante de los de Obys, porque son obra propia. La numeración del carrusel se recalcula sobre la lista combinada, así que es correlativa (`01` es el primero de Lab). Cada pieza sabe a dónde lleva: las de Lab a `/lab/<slug>` y las de Obys a `/work/<slug>`. La grilla de `/work` sigue mostrando sólo los de Obys, con su numeración original.

Esa unión vive en [`src/data/homeItems.js`](src/data/homeItems.js). Si algún día querés que la home muestre **sólo** lo tuyo, se borra el spread de `projects` de ahí y listo.

Conviene poner `w` y `h`: reservan la caja antes de que cargue la imagen y evitan que la grilla salte. Se sacan con `sips -g pixelWidth -g pixelHeight archivo.jpg`.

Para las imágenes, WebP o JPG con el lado largo en ~1600px alcanza. Las de `newArt` están en 2848px y ~1MB cada una: se ven bien pero hacen la página más pesada de lo necesario.

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
