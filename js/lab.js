/* lab.js — construye la galería a color de la página Lab.

   Mezcla dos fuentes reales que ya viven en el proyecto: las fotos de estudio
   (window.OBYS_LAB, las mismas que About muestra en blanco y negro) y las
   portadas de los 19 proyectos (window.OBYS_PROJECTS). Se intercalan para que
   la grilla alterne formatos y temas en vez de agrupar todo por origen. */

(function () {
  "use strict";

  const gallery = document.querySelector("[data-lab-gallery]");
  if (!gallery) return;

  const photos = (window.OBYS_LAB || []).map((p) => ({
    img: p.img,
    w: p.w,
    h: p.h,
    title: p.brand,
    meta: [p.category, p.subtitle].filter(Boolean).join(" · "),
    year: p.year,
    href: null,
  }));

  const works = (window.OBYS_PROJECTS || []).map((p) => ({
    img: p.img,
    w: null,
    h: null,
    title: p.name,
    meta: p.category,
    year: p.n,
    href: `/work/project.html?slug=${p.slug}`,
  }));

  /* Intercalado: se recorre la lista más larga y se va tomando de cada una
     mientras queden elementos, así ninguna queda toda apelmazada al final. */
  function interleave(a, b) {
    const out = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (i < a.length) out.push(a[i]);
      if (i < b.length) out.push(b[i]);
    }
    return out;
  }

  const items = interleave(photos, works);
  if (!items.length) return;

  const frag = document.createDocumentFragment();

  items.forEach((it, i) => {
    // Los proyectos enlazan a su ficha; las fotos de estudio no van a ningún
    // lado, así que se construyen como figure y no como enlace muerto.
    const el = document.createElement(it.href ? "a" : "figure");
    el.className = "lab__item";
    if (it.href) el.href = it.href;
    // Escalonar la entrada por posición en la grilla.
    el.style.setProperty("--i", String(i % 12));

    const media = document.createElement("div");
    media.className = "lab__media";

    const img = document.createElement("img");
    img.src = it.img;
    img.alt = it.meta ? `${it.title} — ${it.meta}` : it.title;
    img.loading = i < 6 ? "eager" : "lazy";
    img.decoding = "async";
    if (it.w && it.h) {
      // Reservar la caja antes de que cargue evita saltos en la masonry.
      img.width = it.w;
      img.height = it.h;
    }
    media.appendChild(img);

    const cap = document.createElement("figcaption");
    cap.className = "lab__caption";
    cap.innerHTML =
      `<span class="lab__caption-title"></span>` +
      `<span class="lab__caption-meta"></span>`;
    cap.querySelector(".lab__caption-title").textContent = it.title;
    cap.querySelector(".lab__caption-meta").textContent = it.meta || "";

    const year = document.createElement("span");
    year.className = "lab__year";
    year.textContent = it.year || "";

    el.append(media, cap, year);
    frag.appendChild(el);
  });

  gallery.appendChild(frag);

  /* En touch no hay :hover, así que el primer toque revela la ficha y el
     segundo navega (o la cierra, si el item no enlaza a ningún lado). */
  if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) {
    const all = [...gallery.querySelectorAll(".lab__item")];
    all.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!item.classList.contains("is-open")) {
          if (item.tagName === "A") e.preventDefault();
          all.forEach((o) => o.classList.remove("is-open"));
          item.classList.add("is-open");
        }
      });
    });
  }

  /* Aparición escalonada al entrar en viewport. Se activa solo si hay soporte,
     y el CSS deja los items visibles por defecto: si esto no corre, la galería
     se ve igual, nunca vacía. */
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("lab-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    gallery.querySelectorAll(".lab__item").forEach((el) => io.observe(el));
  }
})();
