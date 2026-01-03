// Agent Loop page helpers:
// - Ensure Prism autoloads missing language grammars (Python/Bash) and highlights.
// - Add copy-to-clipboard buttons to code blocks.
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

  function copyToClipboard(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback for older browsers / non-secure contexts
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("execCommand(copy) failed"));
      } catch (e) {
        reject(e);
      }
    });
  }

  function addCopyButtons(root) {
    var pres = root.querySelectorAll("pre");
    pres.forEach(function (pre) {
      // Only add to real code blocks
      var codeEl = pre.querySelector("code");
      if (!codeEl) return;

      // Avoid duplicates on reruns
      if (pre.querySelector("button.agent-loop-copy-btn")) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "agent-loop-copy-btn";
      btn.setAttribute("aria-label", "Copy code");
      btn.title = "Copy to clipboard";
      btn.textContent = "Copy";

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        var text = (codeEl.textContent || "").replace(/\s+$/, "\n");
        var original = btn.textContent;
        btn.textContent = "Copying…";
        btn.disabled = true;

        copyToClipboard(text)
          .then(function () {
            btn.textContent = "Copied!";
            setTimeout(function () {
              btn.textContent = original;
              btn.disabled = false;
            }, 1200);
          })
          .catch(function () {
            btn.textContent = "Failed";
            setTimeout(function () {
              btn.textContent = original;
              btn.disabled = false;
            }, 1500);
          });
      });

      pre.appendChild(btn);
    });
  }

  function run() {
    var root = document.querySelector(".agent-loop-notion");
    if (!root) return;

    // Then ensure Prism highlights remaining code blocks.
    normalizePrismClasses(root);
    highlightPrism(root);

    // Add copy buttons (DeepLearning-Julia style UX)
    addCopyButtons(root);
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


