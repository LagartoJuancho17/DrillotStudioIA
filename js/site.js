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

  function startClock() {
    const els = qsa("[data-clock]");
    if (!els.length) return;
    const STUDIO_TZ = "Europe/Amsterdam";
    function tick() {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: STUDIO_TZ,
        timeZoneName: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(now);
      const get = (type) => parts.find((p) => p.type === type)?.value || "";
      const label = `${get("timeZoneName")} ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
      els.forEach((el) => (el.textContent = label));
    }
    tick();
    setInterval(tick, 15000);
  }

  function initContactModal() {
    const modal = qs("[data-contact-modal]");
    if (!modal) return;
    const openers = qsa("[data-contact-open]");
    const closers = qsa("[data-contact-close]", modal);

    function open() {
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("is-open"));
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
      const skip = sessionStorage.getItem("obys-visited");

      const state = { v: 0 };
      const dur = skip ? 0.6 : 1.7;

      if (window.gsap) {
        gsap.to(state, {
          v: 100,
          duration: dur,
          ease: "power2.inOut",
          onUpdate: () => {
            if (countEl) countEl.textContent = Math.round(state.v);
          },
          onComplete: finish,
        });
      } else {
        if (countEl) countEl.textContent = "100";
        setTimeout(finish, dur * 1000);
      }

      function finish() {
        sessionStorage.setItem("obys-visited", "1");
        document.body.classList.add("is-ready");
        pre.classList.add("is-done");
        setTimeout(() => {
          pre.remove();
          resolve();
        }, 900);
      }
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
    startClock();
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
