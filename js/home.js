/* home.js — motor de scroll interceptado de la home.

   El sitio real no scrollea de forma nativa: el wheel alimenta una posición
   virtual que desplaza una tira de imágenes en bucle infinito, con el
   proyecto activo siempre centrado. La lista de nombres se mueve en sincronía
   y la fila de metadatos (categoría / servicios / número) queda fija al
   centro mostrando el activo.

   Estructura del bucle: se renderizan TRES copias de los 19 proyectos y la
   tira se desplaza sobre la copia del medio. Así siempre hay contenido real
   arriba y abajo del centro, y al envolver la posición el salto es invisible
   porque la copia vecina ya está dibujada en el mismo lugar. */

(function () {
  "use strict";

  const projects = window.OBYS_PROJECTS || [];
  if (!projects.length) return;

  /* Los cinco formatos que el sitio real alterna en ciclo (aspect-ratio y
     ancho en rem, medidos del DOM original). */
  const FORMATS = [
    { ar: 1.0, w: 13.2 },
    { ar: 0.8, w: 17.5 },
    { ar: 1.0, w: 18.4 },
    { ar: 0.67, w: 13.2 },
    { ar: 1.5, w: 19.6 },
  ];

  const SETS = 3;
  const MID = 1; // índice de la copia sobre la que se navega
  const LERP = 0.085;
  const WHEEL_SPEED = 1.0;
  const TOUCH_SPEED = 1.6;

  const homeEl = document.querySelector("[data-home]");
  const stripEl = document.querySelector("[data-filmstrip]");
  const listTrackEl = document.querySelector("[data-list-track]");
  const gridViewEl = document.querySelector("[data-grid-view]");
  const metaCategory = document.querySelector("[data-meta-category]");
  const metaServices = document.querySelector("[data-meta-services]");
  const metaNumber = document.querySelector("[data-meta-number]");

  if (!homeEl || !stripEl || !listTrackEl) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let target = 0;   // posición virtual pedida
  let current = 0;  // posición virtual interpolada
  let setH = 0;     // alto (o ancho) de UNA copia de los 19
  let nameH = 0;    // alto de un nombre de la lista
  let centers = []; // centro de cada proyecto dentro de una copia
  let slides = [];
  let names = [];
  let activeIndex = -1;
  let horizontal = false;
  let enabled = true;
  let rafId = null;

  const mod = (n, m) => ((n % m) + m) % m;
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

  /* ---------- construcción del DOM ---------- */

  function buildStrip() {
    const frag = document.createDocumentFragment();
    slides = [];
    for (let s = 0; s < SETS; s++) {
      projects.forEach((p, i) => {
        const fmt = FORMATS[i % FORMATS.length];
        const a = document.createElement("a");
        a.className = "home__slide";
        a.href = `/work/project.html?slug=${p.slug}`;
        a.style.width = fmt.w + "rem";
        a.style.aspectRatio = String(fmt.ar);
        a.setAttribute("aria-label", p.name);
        if (s !== MID) a.setAttribute("aria-hidden", "true");
        if (s !== MID) a.tabIndex = -1;

        const img = document.createElement("img");
        img.src = p.img;
        img.alt = s === MID ? p.name : "";
        img.loading = s === MID ? "eager" : "lazy";
        img.draggable = false;
        a.appendChild(img);

        a.dataset.index = String(i);
        frag.appendChild(a);
        slides.push(a);
      });
    }
    stripEl.appendChild(frag);
  }

  function buildNames() {
    const frag = document.createDocumentFragment();
    names = [];
    for (let s = 0; s < SETS; s++) {
      projects.forEach((p, i) => {
        const a = document.createElement("a");
        a.className = "home__list-item";
        a.href = `/work/project.html?slug=${p.slug}`;
        a.textContent = p.name;
        if (s !== MID) {
          a.setAttribute("aria-hidden", "true");
          a.tabIndex = -1;
        }
        a.dataset.index = String(i);
        // Click en un nombre: llevar el carrusel a ese proyecto por el
        // camino más corto en vez de navegar de una.
        a.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          if (activeIndex === i) return; // ya centrado: dejar navegar
          e.preventDefault();
          goTo(i);
        });
        frag.appendChild(a);
        names.push(a);
      });
    }
    listTrackEl.appendChild(frag);
  }

  function buildGridView() {
    if (!gridViewEl) return;
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
      const cat = document.createElement("p");
      cat.textContent = p.category;

      a.append(fig, h3, cat);
      frag.appendChild(a);
    });
    gridViewEl.appendChild(frag);
  }

  /* ---------- medición ---------- */

  function measure() {
    const gap = parseFloat(getComputedStyle(stripEl).gap) || 0;
    const one = slides.slice(0, projects.length);

    centers = [];
    let acc = 0;
    one.forEach((el) => {
      const r = el.getBoundingClientRect();
      const size = horizontal ? r.width : r.height;
      centers.push(acc + size / 2);
      acc += size + gap;
    });
    setH = acc; // incluye el gap final: el que separa la copia N de la N+1

    nameH = names.length ? names[0].getBoundingClientRect().height : 0;
  }

  /* ---------- posición → índice ---------- */

  /* Índice fraccionario continuo: en qué punto del listado estamos, contando
     los tramos entre centros consecutivos. Permite que la lista de nombres
     (altura uniforme) siga el movimiento de la tira (alturas variables) sin
     saltos. */
  function fractionalIndex(p) {
    const n = centers.length;
    const q = mod(p, setH);
    for (let i = 0; i < n; i++) {
      const a = centers[i];
      const b = i + 1 < n ? centers[i + 1] : centers[0] + setH;
      if (q >= a && q < b) return i + (q - a) / (b - a);
    }
    // q cae antes del primer centro: tramo que viene del último de la copia previa
    const last = centers[n - 1] - setH;
    const first = centers[0];
    return mod(n - 1 + (q - last) / (first - last), n);
  }

  function goTo(i) {
    const n = projects.length;
    const from = fractionalIndex(current);
    // camino más corto en un anillo de n posiciones
    let delta = mod(i - from + n / 2, n) - n / 2;
    const fromCenterQ = mod(current, setH);
    const toQ = centers[i];
    let d = toQ - fromCenterQ;
    // reconciliar con la dirección elegida por `delta`
    if (delta > 0 && d < 0) d += setH;
    if (delta < 0 && d > 0) d -= setH;
    target = current + d;
  }

  /* ---------- render ---------- */

  function render() {
    const p = mod(current, setH);
    const offset = p + MID * setH;

    if (horizontal) {
      stripEl.style.transform = `translateY(-50%) translateX(${-offset}px)`;
    } else {
      stripEl.style.transform = `translateX(-50%) translateY(${-offset}px)`;
    }

    const f = fractionalIndex(current);
    const nameOffset = f * nameH + nameH / 2 + MID * projects.length * nameH;
    listTrackEl.style.transform = `translateY(${-nameOffset}px)`;

    const idx = Math.round(f) % projects.length;
    if (idx !== activeIndex) setActive(idx);
  }

  function setActive(i) {
    activeIndex = i;
    const p = projects[i];
    if (!p) return;

    names.forEach((el) => el.classList.toggle("is-active", +el.dataset.index === i));
    slides.forEach((el) => el.classList.toggle("is-active", +el.dataset.index === i));

    if (metaCategory) metaCategory.textContent = p.category;
    if (metaServices) metaServices.textContent = p.services;
    if (metaNumber) metaNumber.textContent = p.n;
  }

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) < 0.05) {
      current = target;
    } else {
      current += diff * (reduced ? 1 : LERP);
    }
    render();
    rafId = requestAnimationFrame(tick);
  }

  /* ---------- entrada del usuario ---------- */

  function onWheel(e) {
    if (!enabled) return;
    e.preventDefault();
    target += e.deltaY * WHEEL_SPEED;
  }

  let touchLast = null;
  function onTouchStart(e) {
    if (!enabled) return;
    touchLast = horizontal ? e.touches[0].clientX : e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (!enabled || touchLast === null) return;
    e.preventDefault();
    const now = horizontal ? e.touches[0].clientX : e.touches[0].clientY;
    target += (touchLast - now) * TOUCH_SPEED;
    touchLast = now;
  }
  function onTouchEnd() {
    touchLast = null;
  }

  function onKey(e) {
    if (!enabled) return;
    const n = projects.length;
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      goTo(mod(activeIndex + 1, n));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goTo(mod(activeIndex - 1, n));
    }
  }

  /* ---------- vistas ---------- */

  function setView(view) {
    homeEl.classList.remove("view-vertical", "view-horizontal", "view-grid");
    homeEl.classList.add("view-" + view);

    horizontal = view === "horizontal";
    enabled = view !== "grid";

    // La vista Grid vuelve al scroll nativo del documento.
    document.documentElement.style.overflow = enabled ? "hidden" : "";
    document.body.style.overflow = enabled ? "hidden" : "";

    if (enabled) {
      // Reconstruir medidas: cambian los ejes entre vertical y horizontal.
      requestAnimationFrame(() => {
        measure();
        const keep = activeIndex >= 0 ? activeIndex : 0;
        current = centers[keep];
        target = current;
        render();
      });
    }
  }

  function initViewToggle() {
    const toggle = document.querySelector("[data-view-toggle]");
    if (!toggle) return;
    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-view]");
      if (!btn) return;
      toggle.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("is-on", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      setView(btn.getAttribute("data-view"));
    });
  }

  /* ---------- arranque ---------- */

  function init() {
    buildStrip();
    buildNames();
    buildGridView();
    initViewToggle();

    homeEl.classList.add("view-vertical");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    measure();
    current = centers[0] || 0;
    target = current;
    setActive(0);
    render();

    // Las medidas dependen de la webfont y del tamaño del viewport: recalcular
    // cuando cualquiera de los dos cambie, conservando el proyecto activo.
    const remeasure = () => {
      const keep = activeIndex >= 0 ? activeIndex : 0;
      measure();
      current = centers[keep];
      target = current;
      render();
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    let resizeRaf = null;
    window.addEventListener("resize", () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(remeasure);
    });

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    if (rafId) cancelAnimationFrame(rafId);
    tick();
  }

  init();
})();
