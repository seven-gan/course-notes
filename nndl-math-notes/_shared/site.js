/* =============================================================
 * 深度学习数学基础 · 站点外壳脚本
 * site.js
 * -------------------------------------------------------------
 * 读 site-data.js（唯一数据源），在每页自动注入：
 *   ① 顶部导航条（含「课程」下拉）
 *   ② 面包屑
 *   ③ 页尾「上一讲 / 下一讲」
 *   ④ 首页的模式渲染（当 <body data-page="home"> 时）
 *
 * 兼容 file:// 直接双击打开：全部内联生成，不依赖 fetch / 网络。
 * 完成人：Codex（OpenAI）· 2026-09-10
 * ============================================================= */
(function () {
  'use strict';

  var SITE = window.NNDL_SITE;
  if (!SITE) { console.warn('[site.js] 未找到 site-data.js'); return; }

  /* 按讲次编号 num 排序 —— 这样在 site-data.js 里新增一条时，
     写在哪一行都无所谓，显示顺序永远由 num 决定。 */
  if (Array.isArray(SITE.lessons)) {
    SITE.lessons.sort(function (a, b) { return (a.num || 0) - (b.num || 0); });
  }

  /* ---------- 小工具 ---------- */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function currentFile() {
    var p = (location.pathname || '').split('/').pop();
    return p || 'index.html';
  }
  function norm(href) {
    // './lesson-01-x.html' -> 'lesson-01-x.html'
    return String(href || '').replace(/^\.\//, '').split('/').pop();
  }
  function findCurrentLesson() {
    var f = currentFile();
    for (var i = 0; i < SITE.lessons.length; i++) {
      if (norm(SITE.lessons[i].href) === f) return { lesson: SITE.lessons[i], index: i };
    }
    return null;
  }
  function statusText(st) {
    return st === 'ready' ? '已就绪' : (st === 'draft' ? '草稿' : '计划中');
  }

  /* ---------- ① 顶部导航条 ---------- */
  function buildTopbar() {
    var cur = findCurrentLesson();
    var curFile = currentFile();

    var bar = el('div', { 'class': 'site-topbar' });
    var inner = el('div', { 'class': 'site-topbar-inner' });

    // 品牌 + 回首页
    inner.appendChild(el('a', { 'class': 'site-brand', href: './index.html' }, esc(SITE.meta.title)));

    var nav = el('nav');
    // 站点级入口
    SITE.sitePages.forEach(function (pg) {
      if (norm(pg.href) === curFile) return; // 当前页不重复列
      nav.appendChild(el('a', { href: pg.href }, esc(pg.short)));
    });

    // 课程下拉
    var det = el('details', { 'class': 'site-menu' });
    var curLabel = cur
      ? ('第 ' + cur.lesson.num + ' 讲 · ' + cur.lesson.title)
      : '全部课程';
    det.appendChild(el('summary', null, esc(curLabel)));
    var list = el('div', { 'class': 'site-menu-list' });
    SITE.lessons.forEach(function (L) {
      var isCur = cur && cur.lesson.id === L.id;
      var a = el('a', {
        href: L.href,
        'class': (isCur ? 'active' : '') + (L.status !== 'ready' ? ' is-planned' : '')
      },
        '<span class="mt">第 ' + L.num + ' 讲 · ' + esc(L.title) + '</span>' +
        '<span class="ms">' + esc(L.subtitle || '') + '</span>');
      list.appendChild(a);
    });
    if (SITE.planned && SITE.planned.length) {
      SITE.planned.forEach(function (P) {
        var a = el('a', { 'class': 'is-planned', href: 'javascript:void(0)' },
          '<span class="mt">' + esc(P.title) + '</span>' +
          '<span class="ms">' + esc(P.subtitle || '') + ' · 计划中</span>');
        list.appendChild(a);
      });
    }
    det.appendChild(list);
    nav.appendChild(det);

    // 点开下拉后，点别处自动收起
    document.addEventListener('click', function (e) {
      if (!det.contains(e.target)) det.open = false;
    });

    inner.appendChild(nav);
    bar.appendChild(inner);
    return bar;
  }

  /* ---------- ② 面包屑 ---------- */
  function buildCrumb() {
    var f = currentFile();
    var cur = findCurrentLesson();
    var c = el('div', { 'class': 'site-crumb' });
    if (norm('./index.html') === f) return null;

    c.appendChild(el('a', { href: './index.html' }, '首页'));
    if (cur) {
      c.appendChild(el('span', { 'class': 'sep' }, '/'));
      c.appendChild(el('a', { href: './nndl-math-notes.html' }, '学习路线图'));
      c.appendChild(el('span', { 'class': 'sep' }, '/'));
      c.appendChild(el('span', { 'class': 'here' },
        '第 ' + cur.lesson.num + ' 讲 · ' + esc(cur.lesson.title)));
    } else if (norm('./nndl-math-notes.html') === f) {
      c.appendChild(el('span', { 'class': 'sep' }, '/'));
      c.appendChild(el('span', { 'class': 'here' }, '学习路线图'));
    }
    return c;
  }

  /* ---------- ③ 上一讲 / 下一讲 ---------- */
  function buildPager() {
    var cur = findCurrentLesson();
    if (!cur) return null;
    var prev = SITE.lessons[cur.index - 1];
    var next = SITE.lessons[cur.index + 1];
    var w = el('div', { 'class': 'site-pager' });

    if (prev && prev.status === 'ready') {
      w.appendChild(el('a', { href: prev.href },
        '<span class="dir">← 上一讲</span><span class="ttl">第 ' + prev.num + ' 讲 · ' + esc(prev.title) + '</span>'));
    } else {
      w.appendChild(el('span', { 'class': 'spacer' }, '<span class="dir">← 上一讲</span><span class="ttl">已是第一讲</span>'));
    }
    if (next && next.status === 'ready') {
      w.appendChild(el('a', { 'class': 'next', href: next.href },
        '<span class="dir">下一讲 →</span><span class="ttl">第 ' + next.num + ' 讲 · ' + esc(next.title) + '</span>'));
    } else {
      w.appendChild(el('span', { 'class': 'spacer next' }, '<span class="dir">下一讲 →</span><span class="ttl">已是最后一讲</span>'));
    }
    return w;
  }

  /* ---------- ④ 首页渲染 ---------- */
  function renderHome() {
    var host = document.getElementById('site-home-cards');
    if (host) {
      SITE.lessons.forEach(function (L) {
        var a = el('a', { 'class': 'site-card', href: L.href });
        a.innerHTML =
          '<span class="top"><span class="badge">' + esc(L.code) + '</span>' +
          '<h3>第 ' + L.num + ' 讲 · ' + esc(L.title) + '</h3></span>' +
          '<span class="sub">' + esc(L.subtitle || '') + '</span>' +
          '<span class="desc">' + esc(L.summary || '') + '</span>' +
          '<span class="meta">' +
            '<span>原书 ' + esc(L.pages) + ' 页</span>' +
            '<span>建议 ' + esc(L.hours || '—') + '</span>' +
            '<span>自测 ' + (L.quizzes || 0) + ' 题</span>' +
            '<span>插图 ' + (L.figures || 0) + ' 张</span>' +
          '</span>' +
          '<span class="st ready">' + statusText(L.status) + '</span>';
        host.appendChild(a);
      });
    }
    var phost = document.getElementById('site-home-planned');
    if (phost && SITE.planned) {
      SITE.planned.forEach(function (P) {
        var d = el('div', { 'class': 'site-card is-planned' });
        d.innerHTML =
          '<span class="top"><h3>' + esc(P.title) + '</h3></span>' +
          '<span class="sub">' + esc(P.subtitle || '') + '</span>' +
          '<span class="desc">' + esc(P.note || '') + '</span>' +
          '<span class="st planned">计划中</span>';
        phost.appendChild(d);
      });
    }
    // 统计条
    var stats = document.getElementById('site-home-stats');
    if (stats) {
      var total = SITE.lessons.length;
      var pages = SITE.lessons.reduce(function (s, L) { return s + (L.pageCount || 0); }, 0);
      var quiz = SITE.lessons.reduce(function (s, L) { return s + (L.quizzes || 0); }, 0);
      var figs = SITE.lessons.reduce(function (s, L) { return s + (L.figures || 0); }, 0);
      stats.innerHTML =
        '<li>共 <b>' + total + '</b> 讲</li>' +
        '<li>覆盖原书 <b>' + pages + '</b> 页</li>' +
        '<li>自测题 <b>' + quiz + '</b> 道（含详解）</li>' +
        '<li>手绘插图 <b>' + figs + '</b> 张</li>' +
        '<li>版本 <b>' + esc(SITE.meta.version) + '</b> · ' + esc(SITE.meta.updated) + '</li>';
    }
    // 首页标题与副标题
    var t = document.getElementById('site-home-title');
    if (t) t.textContent = SITE.meta.title;
    var st = document.getElementById('site-home-subtitle');
    if (st) st.textContent = SITE.meta.subtitle;
  }

  /* ---------- ⑤ 路线图页的讲次列表 ---------- */
  function renderRoadmapList() {
    var host = document.getElementById('site-roadmap-list');
    if (!host) return;
    SITE.lessons.forEach(function (L) {
      var li = el('li');
      var inner = '<span><span class="t">第 ' + L.num + ' 讲 · ' + esc(L.title) + '</span>' +
                  '<span class="s">' + esc(L.summary || '') + '</span></span>';
      if (L.status === 'ready') {
        li.innerHTML = '<a class="nav-item ready" href="' + L.href + '">' + inner +
                       '<span class="st">' + statusText(L.status) + '</span></a>';
      } else {
        li.innerHTML = '<span class="nav-item pending">' + inner +
                       '<span class="st">' + statusText(L.status) + '</span></span>';
      }
      host.appendChild(li);
    });
  }

  /* ---------- 装配 ---------- */
  function mount() {
    var page = document.querySelector('article.page') || document.body;

    var bar = buildTopbar();
    var crumb = buildCrumb();

    // 顶部条插到最前；面包屑紧随其后（若页面已有 backlink，则替换掉它）
    var anchor = page.firstChild;
    page.insertBefore(bar, anchor);
    if (crumb) page.insertBefore(crumb, bar.nextSibling);

    var oldBack = page.querySelector('a.backlink');
    if (oldBack) oldBack.remove();

    // 页尾分页器插在 </footer> 之前
    var pager = buildPager();
    if (pager) {
      var foot = page.querySelector('footer');
      if (foot) page.insertBefore(pager, foot);
      else page.appendChild(pager);
    }

    if (document.body.getAttribute('data-page') === 'home') renderHome();
    renderRoadmapList();

    document.documentElement.setAttribute('data-site-mounted', '1');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
