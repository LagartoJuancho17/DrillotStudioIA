/* Mini proyectos de Lab.

   Para agregar uno: creá la carpeta en /public/img/lab/<slug>/ y sumá un
   objeto acá. La grilla, la ficha y la navegación anterior/siguiente se arman
   solas, no hay que tocar ningún componente.

   Campos:
     slug      obligatorio. Va en la URL (/lab/<slug>). Conviene que sea igual
               al nombre de la carpeta.
     name      obligatorio. Título visible.
     category  opcional. Sale bajo el título.
     year      opcional. Sale arriba a la derecha.
     favorite  opcional. true lo suma a la sección Favorites. Sacalo o ponelo
               en false y el proyecto sigue existiendo igual, con su ficha y su
               lugar en /lab y en el carrusel de la home: sólo deja de estar
               destacado.
     cover     obligatorio. La imagen de la grilla.
     images    las imágenes de la ficha, en orden.

   Las imágenes aceptan dos formas:
     "/img/lab/x/1.jpg"
     { src: "/img/lab/x/1.jpg", w: 2848, h: 1696 }

   La segunda es mejor: con w y h el navegador reserva la caja antes de que
   cargue la imagen y la grilla no salta. Para averiguarlas:
     sips -g pixelWidth -g pixelHeight archivo.jpg
*/

export const labProjects = [
  {
    slug: "newArt",
    name: "New Art",
    category: "",
    year: "",
    favorite: true,
    cover: { src: "/img/lab/newArt/portada.jpg", w: 2848, h: 1696 },
    images: [
      { src: "/img/lab/newArt/img1.jpg", w: 2848, h: 1696 },
      { src: "/img/lab/newArt/img2.jpg", w: 2848, h: 1696 },
      { src: "/img/lab/newArt/img3.jpg", w: 2848, h: 1696 },
    ],
  },
];

/* Las imágenes pueden venir como string o como objeto: se normalizan una sola
   vez acá para que ningún componente tenga que preguntarse de qué forma llegan. */
export const normalizeImage = (image) =>
  typeof image === "string" ? { src: image } : image || {};

export const findLabProjectIndex = (slug) =>
  labProjects.findIndex((p) => p.slug === slug);
