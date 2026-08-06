/* site.js — comportamiento compartido entre todas las páginas:
   inyección de partials, preloader, reloj en vivo, modal de contacto,
   menú mobile y smooth scroll (Lenis). Cada página añade su propio
   script (home.js / about.js / work.js) para su interacción específica. */

(function () {
  "use strict";

  const qs = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  async function includePartial(target, path) {
    const res = await fetch(path);
    const html = await res.text();
    target.innerHTML = html;
  }

  function paintMarks() {
    qsa("[data-mark]").forEach((el) => {
      const key = el.getAttribute("data-mark");
      if (window.OBYS_MARKS && window.OBYS_MARKS[key]) {
        el.innerHTML = window.OBYS_MARKS[key];
      }
    });
  }

  function initContactModal() {
    const modal = qs("[data-contact-modal]");
    if (!modal) return;
    const openers = qsa("[data-contact-open]");
    const closers = qsa("[data-contact-close]", modal);

    function open() {
      modal.hidden = false;
      /* Hay que dejar que el navegador registre el estado cerrado antes de
         agregar la clase, o la transición no tiene desde dónde arrancar.
         Se fuerza un reflow leyendo offsetHeight en vez de usar
         requestAnimationFrame: rAF se frena cuando la pestaña no está
         visible, y ahí el modal quedaba con `hidden` ya quitado y el scroll
         bloqueado pero sin `is-open`, es decir invisible y sin poder
         cerrarse. Un reflow síncrono no depende de la visibilidad. */
      void modal.offsetHeight;
      modal.classList.add("is-open");
      document.documentElement.classList.add("no-scroll");
    }
    function close() {
      modal.classList.remove("is-open");
      document.documentElement.classList.remove("no-scroll");
      setTimeout(() => (modal.hidden = true), 500);
    }
    openers.forEach((btn) => btn.addEventListener("click", open));
    closers.forEach((btn) => btn.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  function initMobileMenu() {
    const toggle = qs("[data-menu-toggle]");
    const header = qs("[data-site-header]");
    if (!toggle || !header) return;
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("menu-is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.classList.toggle("no-scroll", open);
    });
    qsa("a", header).forEach((a) =>
      a.addEventListener("click", () => {
        header.classList.remove("menu-is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.documentElement.classList.remove("no-scroll");
      })
    );
  }

  function markActiveNav() {
    const page = document.body.getAttribute("data-page");
    if (!page) return;
    qsa(`[data-nav="${page}"]`).forEach((a) => a.classList.add("is-on"));
  }

  function setYear() {
    qsa("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  function initSmoothScroll() {
    if (window.Lenis) {
      const lenis = new window.Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      window.__lenis = lenis;
    }
  }

  function runPreloader() {
    return new Promise((resolve) => {
      const pre = qs("[data-preloader]");
      if (!pre) return resolve();
      const countEl = qs("[data-preloader-count]", pre);
      const markEl = qs("[data-preloader-mark]", pre);
      const halfL = qs('[data-preloader-half="l"]', pre);
      const halfR = qs('[data-preloader-half="r"]', pre);
      // ?intro=1 fuerza la intro completa aunque ya se haya visto en la sesión
      // (sirve para revisarla sin tener que limpiar sessionStorage a mano).
      const params = new URLSearchParams(location.search);
      const force = params.has("intro");
      const skip = !force && sessionStorage.getItem("obys-visited");
      const reduced = !force && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Cuánto se abre cada mitad: hasta dejar libre el ancho de la imagen
      // activa de la film-strip, que es lo que el paréntesis enmarca.
      const openX = () => (markEl ? markEl.getBoundingClientRect().width * 0.44 : 90);

      const startedAt = performance.now();
      window.__intro = { path: null, startedAt, endedAt: null };

      function finish() {
        window.__intro.endedAt = performance.now();
        window.__intro.ms = Math.round(window.__intro.endedAt - startedAt);
        sessionStorage.setItem("obys-visited", "1");
        pre.remove();
        resolve();
      }

      window.__intro.decided = { force, skip: !!skip, reduced, gsap: !!window.gsap };

      if (!window.gsap || reduced || skip) {
        window.__intro.path = "fast";
        // Sin GSAP / con motion reducido / en navegación interna: sin teatro.
        if (countEl) countEl.textContent = "100";
        document.body.classList.add("is-ready");
        if (window.gsap) {
          gsap.to(pre, { opacity: 0, duration: 0.45, ease: "power2.out", onComplete: finish });
        } else {
          pre.style.transition = "opacity .45s";
          pre.style.opacity = "0";
          setTimeout(finish, 460);
        }
        return;
      }

      window.__intro.path = "full";
      const counter = { v: 0 };
      const tl = gsap.timeline({ onComplete: finish });
      window.__intro.tl = tl;

      // 1. El contador corre de 0 a 100 durante toda la fase "cerrada".
      tl.to(counter, {
        v: 100,
        duration: 2.2,
        ease: "power1.inOut",
        onUpdate: () => {
          if (countEl) countEl.textContent = Math.round(counter.v);
        },
      }, 0);

      // 2. La marca entra en escala y pasa de contorno a sólido.
      tl.fromTo(markEl, { scale: 0.3 }, { scale: 0.42, duration: 1.4, ease: "power2.out" }, 0);
      tl.to(pre.querySelectorAll("path"), {
        fillOpacity: 1,
        strokeOpacity: 0,
        duration: 0.9,
        ease: "power2.inOut",
      }, 0.9);

      // 3. Fondo negro→blanco y la marca invierte a negro, justo antes de abrir.
      tl.to(pre, { backgroundColor: "#ffffff", duration: 0.7, ease: "power2.inOut" }, 2.0);
      tl.to(markEl, { color: "#000000", duration: 0.7, ease: "power2.inOut" }, 2.0);
      tl.to(countEl, { opacity: 0, duration: 0.4, ease: "power2.out" }, 2.0);
      tl.add(() => document.body.classList.add("is-ready"), 2.0);

      // 4. Las mitades se abren: la marca se convierte en el "( )" de la home.
      tl.to(halfL, { x: -openX(), duration: 1.1, ease: "expo.inOut" }, 2.35);
      tl.to(halfR, { x: openX(), duration: 1.1, ease: "expo.inOut" }, 2.35);
      tl.to(markEl, { scale: 1, duration: 1.1, ease: "expo.inOut" }, 2.35);

      // 5. El overlay se desvanece dejando el "( )" real de la home en su lugar.
      tl.to(pre, { opacity: 0, duration: 0.5, ease: "power2.out" }, 3.15);
    });
  }

  async function boot() {
    const headerMount = qs("[data-include-header]");
    const footerMount = qs("[data-include-footer]");
    const preloaderMount = qs("[data-include-preloader]");

    const jobs = [];
    if (headerMount) jobs.push(includePartial(headerMount, "/partials/header.html"));
    if (footerMount) jobs.push(includePartial(footerMount, "/partials/footer.html"));
    if (preloaderMount) jobs.push(includePartial(preloaderMount, "/partials/preloader.html"));
    await Promise.all(jobs);

    paintMarks();
    initContactModal();
    initMobileMenu();
    markActiveNav();
    setYear();
    initSmoothScroll();

    document.dispatchEvent(new CustomEvent("obys:partials-ready"));

    await runPreloader();
    document.dispatchEvent(new CustomEvent("obys:ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
