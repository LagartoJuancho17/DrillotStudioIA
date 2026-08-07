/* Los 19 proyectos que lista el sitio original: nombre, categoría, servicios,
   número de orden e imagen de portada. Las portadas se enlazan al CDN público
   de Obys, las mismas URLs que sirve el sitio real; no se redistribuye ningún
   archivo. Reemplazalas por material propio si el proyecto sale a algún lado.

   `favorite` decide si el proyecto aparece en la sección Favorites. Ponelo en
   false para sacarlo de ahí sin borrarlo: sigue existiendo, con su ficha y su
   lugar en el carrusel de la home. */

export const projects = [
  { n: "01", slug: "makhno", name: "Makhno", category: "Architecture, Furniture", services: "Creative Direction, Web Design/Dev", img: "https://cms.obys.agency/uploads/Makhno_Thumbnail_e6008952f7.webp", favorite: true },
  { n: "02", slug: "source-unknown", name: "Source Unknown", category: "Fashion", services: "Web Design/Dev", img: "https://cms.obys.agency/uploads/Source_Unknown_Thumbnail_7e7a08561b.webp", favorite: true },
  { n: "03", slug: "autex", name: "Autex", category: "Architecture", services: "Web Design", img: "https://cms.obys.agency/uploads/1_fae12fb704.webp", favorite: true },
  { n: "04", slug: "odins-crow", name: "Odin’s Crow", category: "Fashion, Photography", services: "Creative Direction, Web Design/Dev", img: "https://cms.obys.agency/uploads/Odin_s_Crow_Thumbnail_4dc8764e8a.webp", favorite: true },
  { n: "05", slug: "olga-prudka", name: "Olga Prudka", category: "Photography, Fashion", services: "Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/Olga_Prudka_Thumbnail_73c88a2131.webp", favorite: true },
  { n: "06", slug: "yulia", name: "Yulia", category: "Fashion", services: "Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/Yulia_Thumbnail_3226edc489.webp", favorite: true },
  { n: "07", slug: "the-ways-we-work-miro", name: "The Ways We Work (Miro)", category: "Technology", services: "Web Design/Dev", img: "https://cms.obys.agency/uploads/Miro_Thumbnail_413fefb05d.webp", favorite: true },
  { n: "08", slug: "design-education-series", name: "Design Education Series", category: "Education", services: "Concept, Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/DES_Thumbnail_41ecc849b9.webp", favorite: true },
  { n: "09", slug: "obys-design-books", name: "Obys’ Design Books", category: "Education", services: "Concept, Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/ODB_Thumbnail_ed9b4aa0f3.webp", favorite: true },
  { n: "10", slug: "eminente", name: "Eminente", category: "Fashion, Photography", services: "Creative Direction, Web Design/Dev", img: "https://cms.obys.agency/uploads/Eminente_Thumbnail_d7767e1666.webp", favorite: true },
  { n: "11", slug: "abetka", name: "Abetka", category: "Culture", services: "Concept, Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/Abetka_Thumbnail_25b7c61177.webp", favorite: true },
  { n: "12", slug: "black-sheep", name: "BlackSheep", category: "Architecture, Development", services: "Creative Direction, Web Design/Dev", img: "https://cms.obys.agency/uploads/Black_Sheep_Thumbnail_09c8874314.webp", favorite: true },
  { n: "13", slug: "salience-labs", name: "Salience Labs", category: "Technology", services: "Web Design/Dev, 3D", img: "https://cms.obys.agency/uploads/1_176ec7aa0f.webp", favorite: true },
  { n: "14", slug: "ai-modernism-of-kharkiv", name: "AI Modernism of Kharkiv", category: "Culture, Side Project", services: "Concept, Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/AIM_Thumbnail_de091a7b48.webp", favorite: true },
  { n: "15", slug: "glyphic-biotechnologies", name: "Glyphic Biotechnologies", category: "Technology, Biotech", services: "Creative Direction, Web Design/Dev, 3D", img: "https://cms.obys.agency/uploads/Glyphic_Biotechnologies_Thumbnail_50ecd8bb9a.webp", favorite: true },
  { n: "16", slug: "porsche-taycan", name: "Porsche Taycan", category: "Automotive", services: "Web Design/Dev", img: "https://cms.obys.agency/uploads/4_1eae03d525.webp", favorite: true },
  { n: "17", slug: "ayocin-atmos-lamp", name: "Ayocin (Atmos Lamp)", category: "Technology, Furniture", services: "Creative Direction, Web Design/Dev", img: "https://cms.obys.agency/uploads/Ayocin_Thumbnail_0965a26e06.webp", favorite: true },
  { n: "18", slug: "grids", name: "Grids", category: "Education, Side Project", services: "Concept, Web Design/Dev, Identity", img: "https://cms.obys.agency/uploads/Grids_Thumbnail_674aa5712c.webp", favorite: true },
  { n: "19", slug: "peter-lindbergh", name: "Peter Lindbergh", category: "Fashion, Photography", services: "Concept, Web Design/Dev", img: "https://cms.obys.agency/uploads/Peter_Thumbnail_bee0ce3a78.webp", favorite: true }
];

export const findProjectIndex = (slug) =>
  projects.findIndex((p) => p.slug === slug);
