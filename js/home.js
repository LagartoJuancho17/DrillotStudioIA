/* home.js — lista de trabajos, stage central (filmstrip) y selector de vista
   de la página de inicio. */

(function () {
  "use strict";

  const projects = window.OBYS_PROJECTS || [];
  const AUTOPLAY_MS = 2600;

  const listEl = document.querySelector("[data-work-list]");
  const filmstripEl = document.querySelector("[data-filmstrip]");
  const metaEl = document.querySelector("[data-meta]");
  const metaCategory = document.querySelector("[data-meta-category]");
  const metaServices = document.querySelector("[data-meta-services]");
  const metaNumber = document.querySelector("[data-meta-number]");
  const aboutEl = document.querySelector(".home__about");
  const homeEl = document.querySelector(".home");
  const gridViewEl = document.createElement("div");
  gridViewEl.className = "home__grid-view";

  if (!listEl || !filmstripEl) return;

  let active = 0;
  let autoplayTimer = null;
  let hoverLock = false;

  function buildList() {
    const frag = document.createDocumentFragment();
    projects.forEach((p, i) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/work/project.html?slug=${p.slug}`;
      a.textContent = p.name;
      a.addEventListener("mouseenter", () => {
        hoverLock = true;
        setActive(i);
      });
      a.addEventListener("focus", () => {
        hoverLock = true;
        setActive(i);
      });
      a.addEventListener("mouseleave", () => {
        hoverLock = false;
      });
      li.appendChild(a);
      frag.appendChild(li);
    });
    listEl.appendChild(frag);
    listEl.parentElement.addEventListener("mouseleave", () => {
      hoverLock = false;
    });
  }

  function buildFilmstrip() {
    const frag = document.createDocumentFragment();
    projects.forEach((p) => {
      const fig = document.createElement("figure");
      const img = document.createElement("img");
      img.src = p.img;
      img.alt = p.name;
      img.loading = "lazy";
      fig.appendChild(img);
      frag.appendChild(fig);
    });
    filmstripEl.appendChild(frag);
  }

  function buildGridView() {
    const frag = document.createDocumentFragment();
    projects.forEach((p) => {
      const a = document.createElement("a");
      a.href = `/work/project.html?slug=${p.slug}`;

      const fig = document.createElement("figure");
      const img = document.createElement("img");
      img.src = p.img;
      img.alt = p.name;
      img.loading = "lazy";
      fig.appendChild(img);

      const h3 = document.createElement("h3");
      h3.textContent = `${p.n} — ${p.name}`;
      const pEl = document.createElement("p");
      pEl.textContent = p.category;

      a.append(fig, h3, pEl);
      frag.appendChild(a);
    });
    gridViewEl.appendChild(frag);
    homeEl.appendChild(gridViewEl);
  }

  function setActive(i) {
    active = i;
    const items = listEl.querySelectorAll("li");
    items.forEach((li, idx) => li.classList.toggle("is-active", idx === i));

    const figs = filmstripEl.querySelectorAll("figure");
    figs.forEach((f, idx) => f.classList.toggle("is-active", idx === i));

    const targetFig = figs[i];
    if (targetFig) {
      const offset = targetFig.offsetTop - filmstripEl.offsetHeight / 2 + targetFig.offsetHeight / 2;
      filmstripEl.style.transform = `translateY(${-offset}px)`;
    }

    const p = projects[i];
    if (p && metaCategory && metaServices && metaNumber) {
      metaCategory.textContent = p.category;
      metaServices.textContent = p.services;
      metaNumber.textContent = p.n;
      metaEl.classList.add("is-visible");
    }

    const activeLi = items[i];
    if (activeLi && metaEl) {
      const liRect = activeLi.getBoundingClientRect();
      const homeRect = homeEl.getBoundingClientRect();
      let y = liRect.top - homeRect.top + liRect.height / 2;

      // Nunca dejar que la fila de meta-datos invada el bloque "about"
      // (párrafo + contacto), sin importar la altura del viewport.
      if (aboutEl) {
        const aboutBottom = aboutEl.getBoundingClientRect().bottom - homeRect.top;
        y = Math.max(y, aboutBottom + 24);
      }

      metaEl.style.top = `${y}px`;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (hoverLock) return;
      setActive((active + 1) % projects.length);
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  function initViewToggle() {
    const toggle = document.querySelector("[data-view-toggle]");
    if (!toggle) return;
    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-view]");
      if (!btn) return;
      const view = btn.getAttribute("data-view");

      toggle.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("is-on", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });

      homeEl.classList.remove("view-vertical", "view-horizontal", "view-grid");
      homeEl.classList.add(`view-${view}`);

      if (view === "grid") stopAutoplay();
      else startAutoplay();
    });
  }

  function init() {
    buildList();
    buildFilmstrip();
    buildGridView();
    initViewToggle();
    homeEl.classList.add("view-vertical");
    setActive(0);

    // Reposicionar tras carga de la webfont (cambia métricas de línea) y en resize:
    // el cómputo de posición usa getBoundingClientRect, que queda obsoleto si el
    // layout cambia después de la primera pintura.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setActive(active));
    }
    let resizeRaf = null;
    window.addEventListener("resize", () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => setActive(active));
    });

    const noAuto = new URLSearchParams(location.search).has("noauto");
    document.addEventListener("obys:ready", () => { if (!noAuto) startAutoplay(); }, { once: true });
  }

  init();
})();
