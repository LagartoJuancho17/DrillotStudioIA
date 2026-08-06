/* project.js — reusable project detail template logic. Reads ?slug= from
   location.search, looks it up in window.OBYS_PROJECTS, and populates the
   static markup in work/project.html. Also wires prev/next navigation,
   wrapping around at either end of the project list. If the slug doesn't
   resolve to a known project, redirects back to /work.html. */

(function () {
  "use strict";

  const projects = window.OBYS_PROJECTS || [];

  function getSlug() {
    return new URLSearchParams(location.search).get("slug");
  }

  function findIndexBySlug(slug) {
    return projects.findIndex((p) => p.slug === slug);
  }

  function render(index) {
    const project = projects[index];
    const prevProject = projects[(index - 1 + projects.length) % projects.length];
    const nextProject = projects[(index + 1) % projects.length];

    document.title = `${project.name} — Obys`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `${project.name} — ${project.category}. Unofficial, educational recreation of the obys.agency project page.`
      );
    }

    const categoryEl = document.querySelector("[data-project-category]");
    const servicesEl = document.querySelector("[data-project-services]");
    const numberEl = document.querySelector("[data-project-number]");
    const headingEl = document.querySelector("[data-project-heading]");
    const imageEl = document.querySelector("[data-project-image]");
    const nameInlineEls = document.querySelectorAll("[data-project-name-inline]");
    const caseStudyLinkEl = document.querySelector("[data-project-case-study-link]");
    const prevLinkEl = document.querySelector("[data-project-prev]");
    const prevNameEl = document.querySelector("[data-project-prev-name]");
    const nextLinkEl = document.querySelector("[data-project-next]");
    const nextNameEl = document.querySelector("[data-project-next-name]");

    if (categoryEl) categoryEl.textContent = project.category;
    if (servicesEl) servicesEl.textContent = project.services;
    if (numberEl) numberEl.textContent = project.n;
    if (headingEl) headingEl.textContent = project.name;

    if (imageEl) {
      imageEl.src = project.img;
      imageEl.alt = project.name;
    }

    nameInlineEls.forEach((el) => {
      el.textContent = project.name;
    });

    if (caseStudyLinkEl) {
      caseStudyLinkEl.href = `https://obys.agency/work/${project.slug}`;
    }

    if (prevLinkEl) prevLinkEl.href = `/work/project.html?slug=${prevProject.slug}`;
    if (prevNameEl) prevNameEl.textContent = `${prevProject.n} — ${prevProject.name}`;

    if (nextLinkEl) nextLinkEl.href = `/work/project.html?slug=${nextProject.slug}`;
    if (nextNameEl) nextNameEl.textContent = `${nextProject.n} — ${nextProject.name}`;
  }

  function init() {
    if (!projects.length) {
      location.replace("/work.html");
      return;
    }

    const slug = getSlug();
    const index = slug ? findIndexBySlug(slug) : -1;

    if (index === -1) {
      location.replace("/work.html");
      return;
    }

    render(index);
  }

  init();
})();
