/* 编程基础闯关：自测交互层
 *
 * 设计要点
 * ------------------------------------------------------------------
 * ① **不复制任何内容**。页面渲染后已有：
 *      <details class="note">    <summary>提示</summary>
 *      <details class="success"> <summary>解答</summary>
 *    所以题目、提示、解答都已在 DOM 里，本脚本只做「注入交互 + 记录进度」。
 *    这避免了「题目一份、题库又一份」的维护问题。
 *
 * ② 两层判题：
 *      predict  → 自动判（与页面里**已验证过**的 output 块比对）
 *      concept  → 自评（展开参考答案，用户点「会了/没会」）
 *    不把概念题硬转成选择题 —— 那会毁掉「讲清为什么」的价值。
 *
 * ③ 软锁：显示提示条，但**按钮始终可见**。
 *    静态站 + localStorage ⇒ 锁一定是「镜子」不是「门」，
 *    所以不假装它是强制 —— 它只在用户愿意尊重它时起作用。
 */
(function () {
  "use strict";

  var P = window.KBQuizProgress;
  if (!P) return;                       // 进度模块没加载就静默退出

  /* ---------- 工具 ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function norm(s) {
    return (s || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+$/gm, "")        // 行尾空白无意义
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  /* 当前页在索引里的 key（用 URL 反查最稳）
   *
   * ⚠ URL 末尾是 `/index.html`，而索引里存的是**没有 index.html 的目录路径**
   *   （`code/python/basics/variables`）—— 直接 `endsWith` 永远为 false，
   *   于是整页的交互块都不注入（真浏览器测出来的第二个 bug）。
   *   所以先把 `/index.html` 去掉，再同时兼容带不带尾斜杠两种写法。
   */
  function pageKey(index) {
    var here = location.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
    for (var k in index.pages) {
      var p = index.pages[k].path
        .replace(/\/index\.html$/, "")
        .replace(/\.html$/, "")
        .replace(/\/+$/, "");
      if (here === p || here.endsWith("/" + p) || here.endsWith(p)) return k;
    }
    return null;
  }

  /* ---------- 找到自测区与其后的 Q1..Q4 ---------- */
  /* ⚠ 题号在**渲染后**是 `<strong>Q1</strong>`，不是字面 `**Q1**` ——
   *   markdown 会把 `**…**` 变成 <strong>，所以 `textContent` 里
   *   **根本没有星号**。第一版按 `^\s*\*\*Q(\d)\*\*` 匹配，
   *   于是永远匹配不到、整个交互块都不注入（真浏览器才测出来的 bug）。
   *   正确做法：看段落是不是以「内容恰为 Qn 的 <strong>」开头。
   */
  function questionNo(p) {
    var st = p.querySelector("strong");
    if (!st) return null;
    var m = /^\s*Q\s*(\d)\s*$/.exec(st.textContent || "");
    return m ? +m[1] : null;
  }

  function findQuiz() {
    var h2s = document.querySelectorAll("h2");
    var head = null;
    for (var i = 0; i < h2s.length; i++) {
      if (/自测/.test(h2s[i].textContent)) { head = h2s[i]; break; }
    }
    if (!head) return null;

    // 收集该 h2 之后、下一个 h2 之前的所有节点
    var nodes = [], n = head.nextElementSibling;
    while (n && !/^H2$/.test(n.tagName)) { nodes.push(n); n = n.nextElementSibling; }

    // 在节点里找题号段落，并从它往后收集（含 details）
    var qs = [], cur = null;
    nodes.forEach(function (node) {
      var ps = node.tagName === "P" ? [node] : node.querySelectorAll("p");
      var matched = false;
      Array.prototype.forEach.call(ps, function (p) {
        var no = questionNo(p);
        if (no !== null) {
          cur = { n: no, stem: p, parts: [] };
          qs.push(cur);
          matched = true;
        }
      });
      if (cur && !matched) cur.parts.push(node);
    });
    return { head: head, qs: qs, nodes: nodes };
  }

  /* 从某题的 parts 里取出 note / success 两个 details */
  function detailsOf(parts) {
    var note = null, succ = null;
    parts.forEach(function (x) {
      if (!x.querySelectorAll) return;
      Array.prototype.forEach.call(x.querySelectorAll("details"), function (d) {
        if (d.classList.contains("note") && !note) note = d;
        else if (d.classList.contains("success") && !succ) succ = d;
      });
      if (x.tagName === "DETAILS") {
        if (x.classList.contains("note") && !note) note = x;
        else if (x.classList.contains("success") && !succ) succ = x;
      }
    });
    return { note: note, succ: succ };
  }

  /* 期望输出：从解答里抽 ```output 块（仓库里这些块都实跑核对过） */
  function expectedFrom(succ) {
    if (!succ) return null;
    var pre = succ.querySelector("pre.kb-output, pre code");
    var codes = succ.querySelectorAll("pre");
    for (var i = 0; i < codes.length; i++) {
      var t = codes[i].textContent || "";
      if (t.trim()) return t;          // 第一个非空 pre 就是期望输出
    }
    return null;
  }

  /* ---------- 注入 UI ---------- */
  function build(index, quiz, key) {
    var st = P.get(key);
    var meta = index.pages[key];
    var wrap = el("div", "kbq");

    /* 顶部状态条 */
    var bar = el("div", "kbq-bar");
    var stTxt = { new: "未开始", passed: "已通过", known: "已标记掌握",
                  skipped: "已跳过" }[st.status] || "未开始";
    bar.appendChild(el("span", "kbq-badge kbq-" + st.status, stTxt));
    bar.appendChild(el("span", "kbq-info",
      "本题组 " + quiz.qs.length + " 题" +
      (st.attempts ? "，已试 " + st.attempts + " 次，最好成绩 " + st.best + "/" + st.total : "")));

    var acts = el("span", "kbq-acts");
    var bStart = el("button", "kbq-btn kbq-primary", "开始自测");
    var bKnown = el("button", "kbq-btn", st.status === "known" ? "改回未开始" : "我已掌握");
    var bSkip = el("button", "kbq-btn", st.status === "skipped" ? "取消跳过" : "暂时跳过");
    acts.appendChild(bStart); acts.appendChild(bKnown); acts.appendChild(bSkip);
    bar.appendChild(acts);
    wrap.appendChild(bar);

    /* 每题一块 */
    var panel = el("div", "kbq-panel");
    var types = (meta && meta.questions) || [];

    quiz.qs.forEach(function (q, i) {
      var d = detailsOf(q.parts);
      var type = (types[i] && types[i].type) || "concept";
      var box = el("div", "kbq-q");
      box.appendChild(el("div", "kbq-qhead",
        "第 " + q.n + " 题 · " + (type === "predict" ? "自动判分" : "自评")));

      /* ⚠ **不要**把原解答藏起来 ——
       *   页面原本的 `<details>` 是可折叠的，用户不启动自测也能正常读。
       *   我第一版给它 `display:none`，等于「不开自测就看不了答案」，
       *   凭空改变了原有阅读体验 ✗ 现在只做「滚动 + 展开」。
       */
      if (d.note) d.note.setAttribute("data-kbq-hint", "1");

      if (type === "predict") {
        var exp = expectedFrom(d.succ);
        var ta = el("textarea", "kbq-input");
        ta.rows = 3;
        ta.placeholder = "把你预测的输出填在这里（不必完全一致，忽略行尾空格）";
        box.appendChild(ta);
        var fb = el("div", "kbq-fb");
        var bCheck = el("button", "kbq-btn kbq-primary", "对答案");
        var bShow = el("button", "kbq-btn", "看解答");
        box.appendChild(bCheck); box.appendChild(bShow); box.appendChild(fb);
        bCheck.addEventListener("click", function () {
          var ok = exp != null && norm(ta.value) === norm(exp);
          fb.className = "kbq-fb " + (ok ? "kbq-ok" : "kbq-no");
          fb.textContent = ok
            ? "✓ 对了。"
            : "✗ 不完全对 —— 先看「提示」再试一次，或直接看解答。";
          if (ok) markCorrect(key, quiz.qs.length, q.n);
        });
        bShow.addEventListener("click", function () { goTo(d); });
      } else {
        var fb2 = el("div", "kbq-fb");
        var bReveal = el("button", "kbq-btn kbq-primary", "看参考答案");
        var bYes = el("button", "kbq-btn", "会了");
        var bNo = el("button", "kbq-btn", "没会");
        box.appendChild(bReveal); box.appendChild(bYes); box.appendChild(bNo);
        box.appendChild(fb2);
        bReveal.addEventListener("click", function () { goTo(d); });
        bYes.addEventListener("click", function () {
          fb2.className = "kbq-fb kbq-ok";
          fb2.textContent = "✓ 记下了。";
          markCorrect(key, quiz.qs.length, q.n);
        });
        bNo.addEventListener("click", function () {
          fb2.className = "kbq-fb kbq-no";
          fb2.textContent = "已记入「待复习」，过几天会再提醒你。";
        });
      }
      panel.appendChild(box);
    });
    wrap.appendChild(panel);

    /* 按钮行为 —— 注意：**任何状态都不阻止继续** */
    bStart.addEventListener("click", function () {
      panel.classList.add("kbq-open");
      bar.scrollIntoView({ behavior: "smooth", block: "start" });
    });
bKnown.addEventListener("click", function () {
      var to = st.status === "known" ? "new" : "known";
      P.setStatus(key, to);
      location.reload();                 // 简单可靠地刷新状态条
    });
    bSkip.addEventListener("click", function () {
      var to = st.status === "skipped" ? "new" : "skipped";
      P.setStatus(key, to);
      location.reload();
    });

    /* 插到自测标题之前 */
    quiz.head.parentNode.insertBefore(wrap, quiz.head);
    return wrap;
  }

  /* 滚到原解答并展开它（**不改动它的可见性**，只 `open`）*/
  function goTo(d) {
    if (d.note) d.note.open = true;
    if (d.succ) {
      d.succ.open = true;
      d.succ.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* 记一次答对：够 3/4 就标记通过 */
  var correctMap = {};
  function markCorrect(key, total, n) {
    correctMap[key] = correctMap[key] || {};
    correctMap[key][n] = true;
    var c = Object.keys(correctMap[key]).length;
    P.record(key, c, total);
    updateBar(key, c, total);
  }

  function updateBar(key, c, total) {
    var bar = document.querySelector(".kbq-bar");
    if (!bar) return;
    var b = bar.querySelector(".kbq-badge");
    if (!b) return;
    var pass = total > 0 && c >= Math.ceil(total * 0.75);
    b.textContent = pass ? "已通过" : "答对 " + c + "/" + total;
    b.className = "kbq-badge kbq-" + (pass ? "passed" : "new");
  }

  /* ---------- 首页/关卡页：显示总进度与待复习 ---------- */
  function renderOverview(index) {
    var host = document.querySelector("[data-kbq-overview]");
    if (!host) return;
    var s = P.summary(index);
    var due = P.dueForReview();
    host.innerHTML = "";
    host.appendChild(el("div", "kbq-ov",
      "已通过 " + s.passed + " / " + s.total + " 页" +
      (s.known ? "，标记掌握 " + s.known : "") +
      (s.skipped ? "，跳过 " + s.skipped : "") +
      (s.review ? "，待复习 " + s.review : "")));
    if (due.length) {
      var box = el("div", "kbq-due");
      box.appendChild(el("div", "kbq-duetitle",
        "⏳ 有几页你之前跳过或标记过「已会」，现在该回头看一眼了："));
      due.slice(0, 12).forEach(function (k) {
        var a = el("a", "kbq-duelink", (index.pages[k] || {}).title || k);
        a.href = "../../" + (index.pages[k] || {}).path;
        box.appendChild(a);
      });
      host.appendChild(box);
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    /* ⚠ 索引**不能**用 fetch() 读 .json ——
     *   在 `file://` 下会被 CORS 拦掉（实测：
     *   "Cross origin requests are only supported for protocol schemes:
     *    http, https, ..."），于是本地双击打开就只能静默失败。
     *   而本项目有一条明确原则是「保证离线可用」（KaTeX 全部本地化），
     *   所以改成读 `.js` 里赋的全局变量 —— `<script src>` 不受 CORS 限制。
     */
    var index = window.KBQ_INDEX;
    if (!index) return;                  // 注入缺失就静默降级
    var key = pageKey(index);
    if (key) {
      var quiz = findQuiz();
      if (quiz && quiz.qs.length) build(index, quiz, key);
    }
    renderOverview(index);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
