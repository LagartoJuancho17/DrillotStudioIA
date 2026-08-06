/* work.js — renders the Selected Work grid on work.html from
   window.OBYS_PROJECTS. Same data source and link format as the home
   page's list/grid views (js/home.js), so a project links to the exact
   same /work/project.html?slug=... URL wherever it's clicked from. */

(function () {
  "use strict";

  const projects = window.OBYS_PROJECTS || [];

  const gridEl = document.querySelector("[data-work-grid]");
  const countEl = document.querySelector("[data-work-count]");

  if (!gridEl) return;

  function buildGrid() {
    const frag = document.createDocumentFragment();
    projects.forEach((p) => {
      const a = document.createElement("a");
      a.className = "work__card";
      a.href = `/work/project.html?slug=${p.slug}`;

      const fig = document.createElement("figure");
      fig.className = "work__card-figure";
      const img = document.createElement("img");
      img.src = p.img;
      img.alt = p.name;
      img.loading = "lazy";
      fig.appendChild(img);

      const h3 = document.createElement("h3");
      h3.className = "work__card-name";
      h3.textContent = `${p.n} — ${p.name}`;

      const pEl = document.createElement("p");
      pEl.className = "work__card-category";
      pEl.textContent = p.category;

      a.append(fig, h3, pEl);
      frag.appendChild(a);
    });
    gridEl.appendChild(frag);
  }

  function setCount() {
    if (countEl) countEl.textContent = String(projects.length).padStart(2, "0");
  }

  function init() {
    buildGrid();
    setCount();
  }

  init();
})();
