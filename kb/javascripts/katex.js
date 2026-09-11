/* =============================================================
 * KaTeX 自动渲染配置
 * -------------------------------------------------------------
 * 配合 pymdownx.arithmatex（generic 模式）使用。
 * 使用 document$ 订阅，确保 Material 的即时导航切换后仍能渲染。
 * ============================================================= */
(function () {
  "use strict";

  function renderMath() {
    if (typeof renderMathInElement === "undefined") return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      errorColor: "#cc0000",
      strict: false,
      trust: false,
      macros: {
        "\\R": "\\mathbb{R}",
        "\\N": "\\mathbb{N}",
        "\\E": "\\mathbb{E}",
        "\\Var": "\\operatorname{Var}",
        "\\Cov": "\\operatorname{Cov}",
        "\\argmin": "\\operatorname*{arg\\,min}",
        "\\argmax": "\\operatorname*{arg\\,max}",
        "\\dd": "\\mathrm{d}"
      }
    });
  }

  // Material 即时导航：每次页面切换后重新渲染
  if (typeof document$ !== "undefined") {
    document$.subscribe(renderMath);
  } else {
    document.addEventListener("DOMContentLoaded", renderMath);
  }
})();
