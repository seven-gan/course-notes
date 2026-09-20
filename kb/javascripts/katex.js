/* =============================================================
 * KaTeX 自动渲染配置
 * -------------------------------------------------------------
 * 配合 pymdownx.arithmatex（generic 模式）使用。
 * 使用 document$ 订阅，确保 Material 的即时导航切换后仍能渲染。
 *
 * 性能说明：
 *   · 渲染范围收窄到正文容器 .md-content —— 不再扫描侧栏目录树与搜索结果，
 *     大幅减少每次翻页要遍历的文本节点。
 *   · ignoredClasses 加上 "katex"：已渲染过的公式整体跳过，
 *     重复触发（同页内 document$ 再次回调）时几乎零成本。
 *   · ignoredTags 明确列出 code / pre 等：代码块里的 $ 符号不会被误当公式。
 * ============================================================= */
(function () {
  "use strict";

  var OPTIONS = {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false }
    ],
    // 这些标签内部一律不解析公式（代码、终端输出、原始文本等）
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
    // 这些 class 的子树整体跳过（含已渲染的 KaTeX 输出）
    ignoredClasses: ["katex", "no-render"],
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
  };

  function renderMath() {
    if (typeof renderMathInElement === "undefined") return;
    var root = document.querySelector(".md-content") || document.body;
    if (!root) return;
    renderMathInElement(root, OPTIONS);
  }

  // Material 即时导航：每次页面切换后重新渲染
  if (typeof document$ !== "undefined") {
    document$.subscribe(renderMath);
  } else {
    document.addEventListener("DOMContentLoaded", renderMath);
  }
})();
