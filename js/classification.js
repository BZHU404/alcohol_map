/* Highlight the active section in the classification page TOC. */
(function () {
  "use strict";
  var links = Array.prototype.slice.call(document.querySelectorAll(".classification-toc a[href^='#']"));
  var sections = links.map(function (link) {
    return document.getElementById(link.getAttribute("href").slice(1));
  }).filter(Boolean);
  if (!links.length || !sections.length) return;

  function activate(id) {
    links.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  if (!("IntersectionObserver" in window)) {
    activate(sections[0].id);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    var visible = entries.filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
    if (visible.length) activate(visible[0].target.id);
  }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

  sections.forEach(function (section) { observer.observe(section); });
  activate(sections[0].id);
})();
