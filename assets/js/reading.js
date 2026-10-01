(function () {
  function init() {
    var root = document.querySelector('.essay-content, .agent-loop-notion, #quarto-document-content');
    if (!root) return;
    // Generate contents from actual headings, keeping links in sync with the article.
    var old = root.querySelector('nav.table_of_contents');
    if (old) {
      var details = document.createElement('details');
      details.className = 'essay-toc';
      details.innerHTML = '<summary>On this page</summary><nav aria-label="Table of contents" data-essay-toc></nav>';
      old.replaceWith(details);
    }
    var toc = root.querySelector('[data-essay-toc]');
    if (!toc && root.querySelectorAll('h2, h3').length >= 3) {
      var generated = document.createElement('details');
      generated.className = 'essay-toc';
      generated.innerHTML = '<summary>On this page</summary><nav aria-label="Table of contents" data-essay-toc></nav>';
      root.prepend(generated);
      toc = generated.querySelector('nav');
    }
    if (toc) { root.prepend(toc.closest('details')); toc.textContent = ''; }
    root.querySelectorAll('svg.system-diagram').forEach(function (svg) {
      if (svg.closest('.cloud-grid')) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'diagram-scroll';
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', 'Diagram; scroll horizontally on a narrow screen');
      svg.replaceWith(wrapper); wrapper.appendChild(svg);
    });
    if (toc) root.querySelectorAll('h2, h3').forEach(function (heading, i) {
      if (!heading.id) heading.id = 'section-' + (i + 1);
      var link = document.createElement('a');
      link.href = '#' + heading.id;
      if (heading.tagName === 'H3') link.className = 'toc-subsection';
      link.textContent = heading.textContent;
      toc.appendChild(link);
    });
    root.querySelectorAll('table').forEach(function (table) {
      if (table.parentElement.classList.contains('table-scroll')) return;
      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', 'Scrollable table');
      table.replaceWith(wrapper); wrapper.appendChild(table);
    });
    root.querySelectorAll('img').forEach(function (img) {
      var figure = img.closest('figure');
      if (!img.alt && figure) img.alt = (figure.querySelector('figcaption') || {}).textContent || 'Article illustration';
      if (/Production%20Runtime%20Model|Production Runtime Model|\/image\.png/.test(img.getAttribute('src') || '')) img.classList.add('theme-diagram');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
