/* about.js — page-specific polish for about.html:
   1) progressive-enhancement scroll reveal for the lead / post-gallery
      paragraphs (adds .js-reveal to <html> only if IntersectionObserver
      is available, so no-JS visitors always see the full static copy).
   2) tap-to-toggle gallery captions on touch devices, where :hover never
      fires and :focus-within needs a real click to engage. */

(function () {
  "use strict";

  var root = document.documentElement;
  var revealTargets = document.querySelectorAll(".about__lead p, .about__more p");
  var galleryItems = document.querySelectorAll(".about__gallery-item");

  if (revealTargets.length && "IntersectionObserver" in window) {
    root.classList.add("js-reveal");

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(function (el) {
      io.observe(el);
    });
  }

  if (galleryItems.length && window.matchMedia) {
    var isTouch = !window.matchMedia("(hover: hover)").matches;

    if (isTouch) {
      galleryItems.forEach(function (item) {
        item.addEventListener("click", function () {
          var wasOpen = item.classList.contains("is-open");
          galleryItems.forEach(function (other) {
            other.classList.remove("is-open");
          });
          if (!wasOpen) item.classList.add("is-open");
        });
      });
    }
  }
})();
