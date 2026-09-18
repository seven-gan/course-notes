/* 编程基础闯关：进度状态机
 *
 * 设计要点（都是经过讨论定下来的，不要随意改）
 * ------------------------------------------------------------------
 * ① 四态，**全部可逆**，且**都不阻止继续**：
 *      未开始 → 通过 / 已会 / 跳过
 *    任何状态都能改回（含「标记成不会」）。
 *
 * ② 「跳过」和「已会」都进**待复习队列** —— 这一条最关键：
 *    如果跳过等于「永久删除」，用户点一下「我会了」就再也见不到它，
 *    那就成了**永久知识盲点**。所以跳过必须能**重新出现**。
 *
 * ③ 状态存在 localStorage，按「页面 key」记录；同时提供
 *    **导出/导入**，因为静态站换设备/清缓存就会丢。
 *
 * ④ 这一层**不碰网络**、不依赖任何库，所以离线也能用。
 */
(function (global) {
  "use strict";

  var KEY = "kbquiz.progress.v1";
  var SETTINGS = "kbquiz.settings.v1";

  // ---- 读写（localStorage 可能被禁用，全部包一层保护）----
  function readRaw(k, fallback) {
    try {
      var s = global.localStorage.getItem(k);
      return s ? JSON.parse(s) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeRaw(k, v) {
    try {
      global.localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      // 隐私模式 / 配额满：静默降级，功能仍可用（只是不持久）
      return false;
    }
  }

  function now() { return Date.now(); }

  var state = readRaw(KEY, { v: 1, pages: {} });
  var conf = readRaw(SETTINGS, {
    v: 1,
    // 软锁默认**开启**，但任何页面都能一键跳过
    softlock: true,
    // 待复习：跳过/已会的条目隔多久重新冒出来（毫秒）
    reviewAfterMs: 3 * 24 * 3600 * 1000,
    // 「标记已会」时是否抽 1 题快速确认
    confirmOnMark: true
  });

  function ensure(key) {
    if (!state.pages[key]) {
      state.pages[key] = {
        status: "new",      // new | passed | known | skipped
        best: 0,            // 最好答对题数
        total: 0,           // 该页题数
        attempts: 0,
        at: now(),
        review: null        // 需要复习的时间戳
      };
    }
    return state.pages[key];
  }

  var API = {
    /* ---- 读 ---- */
    get: function (key) { return ensure(key); },
    all: function () { return state.pages; },
    settings: function () { return conf; },

    /* ---- 写：四态 + 可逆 ---- */
    setStatus: function (key, status) {
      var p = ensure(key);
      p.status = status;
      p.at = now();
      // 「跳过」与「已会」都要**之后重新出现**
      if (status === "skipped" || status === "known") {
        p.review = now() + conf.reviewAfterMs;
      } else {
        p.review = null;
      }
      writeRaw(KEY, state);
      return p;
    },

    /* 记一次自测结果：答对 >= 3/4 即算通过（阈值可调）*/
    record: function (key, correct, total) {
      var p = ensure(key);
      p.attempts += 1;
      p.best = Math.max(p.best, correct);
      p.total = total;
      p.at = now();
      var pass = total > 0 && correct >= Math.ceil(total * 0.75);
      p.status = pass ? "passed" : "new";
      p.review = null;
      writeRaw(KEY, state);
      return { pass: pass, page: p };
    },

    /* ---- 待复习队列（「跳过」不等于「删除」的落地处）---- */
    dueForReview: function () {
      var out = [], t = now();
      for (var k in state.pages) {
        var p = state.pages[k];
        if (p.review && p.review <= t) out.push(k);
      }
      return out;
    },
    /* 复习完清掉标记（状态保持用户选的那个）*/
    clearReview: function (key) {
      var p = ensure(key);
      p.review = null;
      p.at = now();
      writeRaw(KEY, state);
    },

    /* ---- 统计（给首页/关卡用）---- */
    summary: function (index) {
      var s = { total: 0, passed: 0, known: 0, skipped: 0, review: 0 };
      if (index && index.pages) {
        s.total = Object.keys(index.pages).length;
      }
      var t = now();
      for (var k in state.pages) {
        var p = state.pages[k];
        if (p.status === "passed") s.passed++;
        else if (p.status === "known") s.known++;
        else if (p.status === "skipped") s.skipped++;
        if (p.review && p.review <= t) s.review++;
      }
      return s;
    },

    /* ---- 导出 / 导入（换设备、清缓存后能恢复）---- */
    exportJSON: function () {
      return JSON.stringify({ v: 1, exportedAt: now(),
                              settings: conf, pages: state.pages }, null, 1);
    },
    importJSON: function (txt) {
      var d = JSON.parse(txt);
      if (!d || typeof d !== "object" || !d.pages) {
        throw new Error("格式不对：缺少 pages 字段");
      }
      state = { v: 1, pages: d.pages };
      if (d.settings) conf = d.settings;
      writeRaw(KEY, state);
      writeRaw(SETTINGS, conf);
      return Object.keys(d.pages).length;
    },
    reset: function () {
      state = { v: 1, pages: {} };
      writeRaw(KEY, state);
    },

    saveSettings: function (patch) {
      for (var k in patch) conf[k] = patch[k];
      writeRaw(SETTINGS, conf);
      return conf;
    }
  };

  global.KBQuizProgress = API;
})(window);
