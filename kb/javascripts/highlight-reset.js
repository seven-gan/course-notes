/* =============================================================
 * 搜索高亮自动清除
 * highlight-reset.js
 * -------------------------------------------------------------
 * 问题：Material 的 search.highlight 会把匹配文字标黄（<mark data-md-highlight>），
 *       且搜索结果链接自带 ?h=关键词 参数。
 *
 * 期望行为（使用者的实际需求）：
 *   高亮只在「搜索栏打开时」有意义。一旦离开搜索状态（按 ESC、关搜索框、
 *   或点页面任意位置继续阅读），高亮就应该消失。
 *
 * 难点：从搜索结果点进页面时，搜索栏在页面加载时就已经是关闭的，
 *       「关闭搜索」事件根本不会触发。
 *       所以不能只监听事件，必须在「页面已就绪 + 搜索栏关闭」时主动清理。
 * ============================================================= */
(function () {
  "use strict";

  var DEBUG = false;
  function log() {
    if (DEBUG && window.console) console.log.apply(console, ["[hl]", ].concat([].slice.call(arguments)));
  }

  /** 搜索面板是否打开 */
  function searchOpen() {
    var t = document.getElementById("__search");
    return !!(t && t.checked);
  }

  /** 清除所有搜索高亮标记（用文本节点替换，内容不变） */
  function clearMarks() {
    var marks = document.querySelectorAll("mark[data-md-highlight]");
    if (!marks.length) return 0;
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var parent = m.parentNode;
      if (!parent) continue;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    }
    return marks.length;
  }

  /** 从 URL 移除 h 参数（保留其它参数与 hash，不刷新页面） */
  function stripHashParam() {
    var url = new URL(window.location.href);
    if (!url.searchParams.has("h")) return false;
    url.searchParams.delete("h");
    var qs = url.searchParams.toString();
    var next = url.pathname + (qs ? "?" + qs : "") + url.hash;
    try {
      history.replaceState(history.state, "", next);
    } catch (e) {
      return false;
    }
    return true;
  }

  function resetAll(reason) {
    var n = clearMarks();
    var st = stripHashParam();
    if (n || st) log("cleared", reason || "", "marks=" + n, "param=" + st);
    return { marks: n, stripped: st };
  }

  /* ---------- 1. 关键修复：页面就绪后若已不在搜索状态，立即清理 ----------
   * 覆盖「从搜索结果点进页面」的情形：此时 ?h= 在 URL 里、
   * 搜索栏是关闭的，需要主动清理，而不是等事件。
   *
   * 但为了让高亮起到「帮你定位」的作用，延迟一小段时间再清，
   * 让你先看到关键词在哪里。
   */
  var SETTLE_MS = 2200;

  function cleanupIfNotSearching(reason, delay) {
    setTimeout(function () {
      if (!searchOpen()) resetAll(reason);
    }, delay == null ? 0 : delay);
  }

  function onPageReady() {
    var url = new URL(window.location.href);
    if (!url.searchParams.has("h")) {
      // 没有 h 参数，只清理可能的残留标记
      cleanupIfNotSearching("navigate-no-param", 0);
      return;
    }
    // 有 h 参数：等一会儿再清，先让人看到高亮
    cleanupIfNotSearching("arrived-with-h", SETTLE_MS);
  }

  /* ---------- 2. 点页面任意位置 = 离开搜索，清理 ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    // 点在搜索界面内部（搜索框、结果列表）不算离开
    if (t && t.closest && t.closest(".md-search")) return;
    // 搜索面板开着时不清理（它们仍在搜索流程中）
    if (searchOpen()) return;
    resetAll("click-page");
  }, true);

  /* ---------- 3. 键盘任何按键也算开始阅读了 ---------- */
  document.addEventListener("keydown", function (e) {
    if (searchOpen()) return;
    // ESC 单独处理（关闭搜索）
    if (e.key === "Escape" || e.key === "Esc") {
      cleanupIfNotSearching("escape", 60);
      return;
    }
    // 其它按键：先清理，避免残留
    resetAll("keydown");
  }, true);

  /* ---------- 4. 滚动页面 = 开始阅读 ---------- */
  var scrollTimer = null;
  window.addEventListener("scroll", function () {
    if (searchOpen()) return;
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () {
      scrollTimer = null;
      resetAll("scroll");
    }, 400);
  }, { passive: true });

  /* ---------- 5. 搜索框关闭事件（保留，覆盖手动关闭） ---------- */
  function watchToggle() {
    var toggle = document.getElementById("__search");
    if (toggle) {
      toggle.addEventListener("change", function () {
        if (!toggle.checked) setTimeout(function () { resetAll("toggle-off"); }, 60);
      });
    }
    var input = document.querySelector(".md-search__input");
    if (input) {
      input.addEventListener("input", function () {
        if (!input.value.trim()) setTimeout(function () { resetAll("input-empty"); }, 60);
      });
    }
  }

  /* ---------- 6. 导航切换（Material 即时导航） ---------- */
  function onNavigate() {
    onPageReady();
    watchToggle();
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(onNavigate);
  }

  function init() {
    watchToggle();
    onPageReady();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  // 兜底：load 之后再检查一次（脚本可能在 DOM 就绪后注入）
  window.addEventListener("load", function () {
    watchToggle();
    onPageReady();
  });

  // 暴露给控制台调试
  window.__clearSearchHighlight = resetAll;
})();
