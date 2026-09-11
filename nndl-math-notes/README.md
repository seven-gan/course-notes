# 深度学习数学基础 · 网站维护说明

> 基于邱锡鹏《神经网络与深度学习》数学基础附录 A–E（2019-11-21 版）
> 完成人：Codex（OpenAI）· 2026-09-10

---

## 一、这是什么

一个**纯静态、完全离线**的教学网站：双击 `index.html` 即可阅读，
不依赖服务器、不依赖网络、不依赖任何第三方库。

- 数学公式：浏览器**原生 MathML**（无需 KaTeX / MathJax）
- 字体：已本地打包在 `_shared/fonts/`
- 无 CDN、无外链、无网络请求

## 二、目录结构

```
nndl-math-notes/
├── index.html                       ← 网站首页（课程卡片）
├── nndl-math-notes.html             ← 学习路线图
├── lesson-01-linear-algebra.html    ← 第 1 讲 附录 A 线性代数
├── lesson-02-calculus.html          ← 第 2 讲 附录 B 微积分
├── lesson-03-optimization.html      ← 第 3 讲 附录 C 数学优化
├── lesson-04-probability.html       ← 第 4 讲 附录 D 概率论
├── lesson-05-information-theory.html← 第 5 讲 附录 E 信息论
└── _shared/
    ├── notes.css              ← 正文样式（各讲共用）
    ├── site.css               ← 网站外壳样式（导航条 / 卡片 / 分页器）
    ├── site-data.js           ← ★ 唯一数据源：课程列表都在这里
    ├── site.js                ← 站点脚本：自动生成导航 / 面包屑 / 上下讲
    ├── lesson-template.html   ← ★ 新增讲次的模板
    └── fonts/                 ← 9 个本地字体文件
```

## 三、怎么新增一讲（只需两步）

**第 1 步：复制模板，写内容**

把 `_shared/lesson-template.html` 复制一份，改好内容后另存为
`lesson-06-xxxx.html`，**与其它讲放在同一目录**。
模板里已用注释标出「改这里 ① ② ③ ④」，照填即可。

**第 2 步：在数据源里加一条记录**

打开 `_shared/site-data.js`，在 `lessons` 数组里照抄一条：

```js
{
  id: 'lesson-06',
  num: 6,
  code: 'F',
  title: '你的标题',
  subtitle: '一句话副标题',
  summary: '卡片上显示的摘要',
  topics: ['要点一', '要点二'],
  href: './lesson-06-xxxx.html',
  pages: '439–450',
  pageCount: 12,
  hours: '4–6 小时',
  quizzes: 6,
  figures: 3,
  status: 'ready'          // ready | draft | planned
}
```

保存，刷新页面即生效。

**会自动更新，无需手工改动的地方：**

- 顶部导航栏的「全部课程」下拉
- 每页的面包屑
- 每页页尾的「上一讲 / 下一讲」
- 首页的课程卡片与统计
- 学习路线图里的讲次列表

> 排序由 `num` 决定，所以这条记录写在数组的哪一行都无所谓。

## 四、只想改文案 / 顺序 / 状态？

改 `_shared/site-data.js` 就够了 —— 它同时驱动全站的导航、卡片与分页。

- 改标题、摘要：直接改对应字段
- 调整顺序：改 `num`
- 标记为「计划中」：`status: 'planned'`（会变灰、不可点击）

## 五、怎么新增一讲（进阶：用构建脚本）

若想用 Python 生成（适合公式特别多的章节），可参考项目根目录的 `_build/`：

- `latex2mathml.py` —— 零依赖的 LaTeX → MathML 转换器
- `build.py` —— 讲义页面的构建函数（已内置站点外壳样式与脚本引用）
- `lesson02.py` ~ `lesson05.py` —— 第 2–5 讲的内容源文件

写好后运行对应脚本即可生成 HTML。新生成的页面会自动带站点导航
（因为 `build.py` 已经引用了 `site.css` / `site-data.js` / `site.js`）。

> 别忘了：仍然要在 `site-data.js` 里登记这一讲，它才会出现在导航里。

## 六、预留的扩展方向

`site-data.js` 的 `planned` 数组里已经预留了三个规划位，
会以灰色「计划中」卡片显示在首页：

1. 原书正文精讲（第 1–15 章）
2. 配套练习与代码（NumPy 手写实现）
3. 公式速查表

做好之后，把它们从 `planned` 移到 `lessons` 即可。

## 七、版本

| 项 | 值 |
|---|---|
| 版本 | 1.1 |
| 更新 | 2026-09-10 |
| 完成人 | Codex（OpenAI） |
| 第 1 讲初稿 | Trae 生成，后经修订 |
