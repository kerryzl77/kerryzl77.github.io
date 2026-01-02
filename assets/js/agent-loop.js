// Agent Loop page helpers:
// - Render Mermaid diagrams from Notion-exported code blocks.
// - Ensure Prism autoloads missing language grammars (Python/Bash) and highlights.
//
// NOTE: This is an external file on purpose — inline scripts get mangled by the site's
// HTML compressor (`_layouts/compress.html`) which can introduce syntax errors.

(function () {
  function getLanguageFromCodeEl(codeEl) {
    if (!codeEl || !codeEl.classList) return "";

    // Notion exports "Plain Text" as two classes: "language-Plain" + "Text"
    if (
      (codeEl.classList.contains("language-Plain") || codeEl.classList.contains("language-plain")) &&
      codeEl.classList.contains("Text")
    ) {
      return "none";
    }

    var className = codeEl.className ? String(codeEl.className) : "";
    var match = className.match(/language-([\w-]+)/i);
    var lang = match && match[1] ? match[1].toLowerCase() : "";

    if (!lang) return "";
    if (lang === "plaintext" || lang === "plain-text" || lang === "plain") return "none";
    if (lang === "py") return "python";
    if (lang === "sh" || lang === "shell") return "bash";
    return lang;
  }

  function normalizePrismClasses(root) {
    var codeEls = root.querySelectorAll("pre > code, code");
    codeEls.forEach(function (codeEl) {
      if (!codeEl.classList) return;
      var lang = getLanguageFromCodeEl(codeEl);
      if (!lang) return;

      Array.from(codeEl.classList).forEach(function (c) {
        if (/^language-/i.test(c)) codeEl.classList.remove(c);
      });
      codeEl.classList.add("language-" + lang);

      var pre = codeEl.closest && codeEl.closest("pre");
      if (pre && pre.classList) {
        Array.from(pre.classList).forEach(function (c) {
          if (/^language-/i.test(c)) pre.classList.remove(c);
        });
        pre.classList.add("language-" + lang);
      }
    });
  }

  function convertMermaidBlocks(root) {
    var blocks = root.querySelectorAll(
      "pre > code.language-mermaid, pre > code.language-Mermaid, code.language-mermaid, code.language-Mermaid"
    );

    blocks.forEach(function (codeEl) {
      var lang = getLanguageFromCodeEl(codeEl);
      if (lang !== "mermaid") return;

      var pre = codeEl.closest && codeEl.closest("pre");
      var src = (codeEl.textContent || "").trimEnd();
      if (!src.trim()) return;

      // Avoid double-conversion if this runs multiple times.
      if (pre && pre.dataset && pre.dataset.mermaidConverted === "true") return;

      var container = document.createElement("div");
      container.className = "mermaid";
      container.textContent = src;
      if (pre && pre.id) container.id = pre.id;

      if (pre && pre.parentNode) {
        if (pre.dataset) pre.dataset.mermaidConverted = "true";
        pre.replaceWith(container);
      } else if (codeEl && codeEl.parentNode) {
        codeEl.replaceWith(container);
      }
    });
  }

  function renderMermaid() {
    if (typeof window.mermaid === "undefined") return;
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
      });

      if (typeof window.mermaid.run === "function") {
        window.mermaid.run({ querySelector: ".agent-loop-notion .mermaid" });
      } else if (typeof window.mermaid.init === "function") {
        window.mermaid.init(undefined, document.querySelectorAll(".agent-loop-notion .mermaid"));
      }
    } catch (e) {
      // Fail soft: keep the source text visible if rendering fails.
      // eslint-disable-next-line no-console
      console.warn("Mermaid render failed:", e);
    }
  }

  function highlightPrism(root) {
    if (typeof window.Prism === "undefined") return;

    try {
      if (window.Prism.plugins && window.Prism.plugins.autoloader) {
        window.Prism.plugins.autoloader.languages_path =
          "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
      }

      if (typeof window.Prism.highlightAllUnder === "function") {
        window.Prism.highlightAllUnder(root);
      } else if (typeof window.Prism.highlightAll === "function") {
        window.Prism.highlightAll();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Prism highlight failed:", e);
    }
  }

  function run() {
    var root = document.querySelector(".agent-loop-notion");
    if (!root) return;

    // Prefer converting Mermaid to diagrams (so Prism doesn't tokenize it first).
    convertMermaidBlocks(root);
    renderMermaid();

    // Then ensure Prism highlights remaining code blocks.
    normalizePrismClasses(root);
    highlightPrism(root);
  }

  // Run early, and also retry after load (Prism/Mermaid may load late).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  window.addEventListener("load", run);
  setTimeout(run, 250);
})();


