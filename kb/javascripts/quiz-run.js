/* 「在浏览器里跑这段代码」按钮 —— 按需懒加载 Pyodide
 *
 * 三条纪律（都是照着这个仓库的实际情况定的）
 * ------------------------------------------------------------------
 * ① **不默认加载**。Pyodide 首次要下几 MB，而全站 80 MB 且要求离线可用。
 *    只有用户真的点「运行」才加载。
 *
 * ② **必须有超时强杀**。这个仓库的编程页里**故意有死循环例子**
 *    （`while i < 3: print("hello")` 漏了自增）。
 *    没有超时，用户点一次运行就得关标签页。所以跑在 Web Worker 里，超时即 terminate。
 *
 * ③ **离线要优雅降级**。加载失败时不能只报错 ——
 *    页面上**本来就有实跑核对过的 output 块**，应该提示用户直接对照它。
 *
 * 关于 npm/pypi 包：只提供最基础的运行。需要 numpy/pandas 的页
 * （科学计算那 19 页）不自动装包 —— 那会再拉几十 MB，
 * 而且这些页的正确性已经由仓库里的 output 块保证了。
 */
(function () {
  "use strict";

  var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  var RUN_TIMEOUT_MS = 8000;      // 超时就当死循环处理
  var worker = null, ready = false, loading = false, queue = null;

  function log(msg) {
    if (window.console && console.log) console.log("[kbpy] " + msg);
  }

  function ensureWorker(onReady, onFail) {
    if (ready) { onReady(); return; }
    if (loading) { queue = { onReady: onReady, onFail: onFail }; return; }
    loading = true;

    try {
      worker = new Worker(
        new URL("pyodide-worker.js", document.baseURI).href);
    } catch (e) {
      loading = false; onFail("无法创建 Web Worker：" + e.message); return;
    }

    worker.onmessage = function (ev) {
      var d = ev.data || {};
      if (d.type === "status") {
        if (queue && queue.onStatus) queue.onStatus(d.text);
        return;
      }
      if (d.type === "ready") {
        ready = true; loading = false;
        log("pyodide " + d.version + " 就绪");
        var q = queue; queue = null;
        if (q) q.onReady();
        return;
      }
      if (d.type === "error") {
        loading = false;
        var q2 = queue; queue = null;
        if (q2) q2.onFail(d.text); else onFail(d.text);
        return;
      }
      if (d.type === "done") {
        if (queue && queue.onResult) queue.onResult(d);
      }
    };
    worker.onerror = function (e) {
      loading = false;
      onFail("运行环境出错：" + (e.message || "未知"));
    };
    worker.postMessage({ cmd: "init", url: PYODIDE_URL });
  }

  /* 带超时的执行：超时 → terminate（死循环就只能这么治） */
  function runWithTimeout(code, onResult) {
    var finished = false;
    var timer = setTimeout(function () {
      if (finished) return;
      finished = true;
      if (worker) worker.terminate();
      worker = null; ready = false; loading = false; queue = null;
      onResult({ text: "", error: "运行超过 " + (RUN_TIMEOUT_MS / 1000) +
        " 秒，已强制停止（很可能是死循环 —— 这一段代码本身就在演示死循环）。" });
    }, RUN_TIMEOUT_MS);

    queue = {
      onResult: function (d) {
        if (finished) return;
        finished = true; clearTimeout(timer);
        onResult(d);
      }
    };
    ensureWorker(function () {
      worker.postMessage({ cmd: "run", code: code });
    }, function (errText) {
      if (finished) return;
      finished = true; clearTimeout(timer);
      onResult({ text: "", error: errText });
    });
  }

  /* ---------- 给页面上的 python 代码块加「运行」按钮 ---------- */
  /*
   * ⚠ 语言标记为什么不能从 DOM 里读：
   *   Material 的 highlight 扩展在**渲染后会把 `language-python` 这个 class
   *   去掉**（实测构建产物里连 `language-` 字样都没有）。
   *   所以构建时由 hook 在每个 ```python 围栏**之前**插了一个
   *   `<!--kbpy-->` 注释，前端据此认块 —— 见 hooks/quiz_inject.py。
   */
  function isPythonBlock(wrap) {
    var n = wrap.previousSibling;
    while (n) {
      if (n.nodeType === 8) return /kbpy/.test(n.nodeValue || "");
      if (n.nodeType === 3 && !n.nodeValue.trim()) { n = n.previousSibling; continue; }
      if (n.nodeType === 1) return false;      // 遇到元素就停
      n = n.previousSibling;
    }
    return false;
  }

  function attach() {
    var wraps = document.querySelectorAll(".md-typeset .highlight");
    Array.prototype.forEach.call(wraps, function (wrap) {
      if (wrap.querySelector(".kbpy-btn")) return;
      if (!isPythonBlock(wrap)) return;        // 只给 python 代码加

      var btn = document.createElement("button");
      btn.className = "kbpy-btn";
      btn.type = "button";
      btn.textContent = "▶ 运行";
      var out = document.createElement("pre");
      out.className = "kbpy-out";
      /* 让读屏用户也能听到「正在运行 / 运行结果 / 出错」的变化 */
      out.setAttribute("role", "status");
      out.setAttribute("aria-live", "polite");
      out.style.display = "none";

      btn.addEventListener("click", function () {
        // 取源码：优先从 table 结构的 code 单元格取（那是真正的代码）
        var codeEl = wrap.querySelector("td.code pre code")
                  || wrap.querySelector("pre code");
        var src = codeEl ? codeEl.textContent : "";
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
        btn.textContent = "运行中…";
        out.style.display = "block";
        out.className = "kbpy-out";
        out.textContent = "正在准备运行环境（首次较慢，需要联网）…";

        runWithTimeout(src, function (d) {
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          btn.textContent = "▶ 运行";
          if (d.error) {
            out.className = "kbpy-out kbpy-err";
            out.textContent = (d.text ? d.text + "\n" : "") + d.error +
              "\n\n提示：本页下方已有「实跑核对过」的输出，可直接对照。";
          } else {
            out.textContent = d.text || "（无输出）";
          }
        });
      });

      wrap.appendChild(btn);
      wrap.appendChild(out);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();
