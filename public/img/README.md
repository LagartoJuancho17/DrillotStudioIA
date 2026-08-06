# Imágenes propias

Poné tus archivos acá y referencialos con ruta absoluta desde la raíz del sitio:
`/img/lab/foto.jpg`. La ruta arranca con `/` porque `work/project.html` vive una
carpeta más adentro y una ruta relativa se rompería ahí.

```
img/
  lab/     fotos de la galería de Lab
  work/    portadas de proyecto
```

## Dónde cambiar cada cosa

| Qué querés cambiar | Archivo a editar |
|---|---|
| Galería de **Lab** (las fotos) | `js/data-lab.js` |
| Portadas de proyecto (se usan en la **home**, en **Work**, en la ficha de cada proyecto y también en Lab) | `js/data-projects.js` |
| Galería y retratos de **About** | `about.html` (están inline, no en un archivo de datos) |

## Formato de `js/data-lab.js`

Cada entrada es un objeto. Cambiá `img` por tu ruta local:

```js
{ img: "/img/lab/mi-foto.jpg", w: 1200, h: 1600,
  brand: "Título", category: "Categoría", subtitle: "Lugar", year: "2026" }
```

`w` y `h` son las dimensiones reales en píxeles. Conviene ponerlas: reservan la
caja antes de que cargue la imagen y evitan que la grilla masonry salte. Si no
las sabés, `sips -g pixelWidth -g pixelHeight archivo.jpg` te las dice.

`brand` sale en negrita en la ficha del hover, `category` y `subtitle` van
debajo separados por un punto, y `year` aparece arriba a la derecha.

Para agregar fotos simplemente sumá objetos a la lista; la galería se arma sola
y no hay que tocar `lab.html` ni el CSS.

## Formato de `js/data-projects.js`

```js
{ n: "01", slug: "mi-proyecto", name: "Mi Proyecto",
  category: "Categoría", services: "Servicios",
  img: "/img/work/mi-proyecto.jpg" }
```

`slug` es lo que va en la URL (`/work/project.html?slug=mi-proyecto`), así que
usá minúsculas y guiones, sin espacios ni acentos.

Si cambiás la **cantidad** de proyectos, el carrusel de la home se adapta solo:
recalcula el bucle y los formatos a partir del largo de la lista.

## Formatos recomendados

WebP o JPG. Para la galería, lado largo de ~1600px alcanza y sobra: más grande
solo hace la página lenta sin verse mejor.

```bash
# convertir a webp (si tenés webp instalado: brew install webp)
cwebp -q 82 foto.jpg -o foto.webp
```

## Ojo con esto

Las imágenes que vienen hoy por defecto se enlazan al CDN público de Obys
(`cms.obys.agency`). No son tuyas: si el proyecto va a salir a algún lado,
reemplazalas por material propio.
