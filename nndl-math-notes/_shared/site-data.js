/* =============================================================
 * 深度学习数学基础 · 站点内容数据源
 * site-data.js
 * -------------------------------------------------------------
 * 这是整个网站的「唯一数据源」。
 * 首页卡片、顶部导航、上一讲 / 下一讲、学习进度，
 * 全部由本文件驱动 —— 各个页面里没有硬编码的课程列表。
 *
 * ★★ 以后「新增一讲」，只需两步（不用改任何其它文件）：
 *   1) 复制 _shared/lesson-template.html，写好内容，
 *      另存为例如 lesson-06-xxxx.html（与其它讲放同一目录）
 *   2) 在下面 lessons 数组里照抄一条，改成新讲的标题与路径
 *   刷新页面即生效：导航栏、首页卡片、上一讲/下一讲会自动接上。
 *
 * ★ 只调整文案 / 顺序 / 状态？改本文件即可。
 *   status 取值： 'ready' 已就绪 | 'draft' 草稿 | 'planned' 计划中
 * ============================================================= */

window.NNDL_SITE = {
  /* ---------- 站点总体信息 ---------- */
  meta: {
    title: '深度学习数学基础',
    subtitle: '《神经网络与深度学习》（邱锡鹏）附录 A–E 精讲',
    version: '1.1',
    updated: '2026-09-10',
    author: 'Codex（OpenAI）',
    source: '邱锡鹏《神经网络与深度学习》2019-11-21 版，原书 395–438 页'
  },

  /* ---------- 站点级页面（首页之外的入口） ---------- */
  sitePages: [
    { id: 'home',    title: '首页',      short: '首页',   href: './index.html' },
    { id: 'roadmap', title: '学习路线图', short: '路线图', href: './nndl-math-notes.html' }
  ],

  /* ---------- ★ 讲次列表：新增内容只改这里 ---------- */
  lessons: [
    {
      id: 'lesson-01',
      num: 1,
      code: 'A',
      title: '线性代数',
      subtitle: '深度学习的「词汇表」',
      summary: '向量与向量空间、范数、矩阵与线性映射、矩阵类型、特征值与特征向量、矩阵分解',
      topics: ['向量与向量空间', '范数', '线性映射', '矩阵操作', '特征值', '矩阵分解'],
      href: './lesson-01-linear-algebra.html',
      pages: '395–403',
      pageCount: 9,
      hours: '4–6 小时',
      quizzes: 8,
      figures: 3,
      status: 'ready'
    },
    {
      id: 'lesson-02',
      num: 2,
      code: 'B',
      title: '微积分',
      subtitle: '深度学习的「变化率」',
      summary: '导数与微分、泰勒公式、积分、矩阵微积分、Logistic 与 Softmax 的导数',
      topics: ['导数与微分', '泰勒公式', '积分', '矩阵微积分', '链式法则', 'Logistic / Softmax'],
      href: './lesson-02-calculus.html',
      pages: '404–412',
      pageCount: 9,
      hours: '5–7 小时',
      quizzes: 8,
      figures: 5,
      status: 'ready'
    },
    {
      id: 'lesson-03',
      num: 3,
      code: 'C',
      title: '数学优化',
      subtitle: '模型是怎么被「练」出来的',
      summary: '优化问题分类、全局与局部最优、梯度下降、拉格朗日乘数法与 KKT 条件',
      topics: ['优化问题分类', '全局 / 局部最优', '梯度下降', '拉格朗日乘数法', '对偶问题', 'KKT 条件'],
      href: './lesson-03-optimization.html',
      pages: '413–419',
      pageCount: 7,
      hours: '4–6 小时',
      quizzes: 6,
      figures: 3,
      status: 'ready'
    },
    {
      id: 'lesson-04',
      num: 4,
      code: 'D',
      title: '概率论',
      subtitle: '模型里的「不确定性」',
      summary: '样本空间、随机变量与随机向量、条件分布、贝叶斯定理、期望方差、随机过程',
      topics: ['样本空间与事件', '随机变量', '随机向量', '贝叶斯定理', '期望与方差', '随机过程'],
      href: './lesson-04-probability.html',
      pages: '420–432',
      pageCount: 13,
      hours: '6–8 小时',
      quizzes: 7,
      figures: 3,
      status: 'ready'
    },
    {
      id: 'lesson-05',
      num: 5,
      code: 'E',
      title: '信息论',
      subtitle: '损失函数是从哪来的',
      summary: '熵、条件熵、互信息、交叉熵、KL/JS 散度、Wasserstein 距离',
      topics: ['熵与自信息', '互信息', '交叉熵', 'KL 散度', 'JS 散度', 'Wasserstein 距离'],
      href: './lesson-05-information-theory.html',
      pages: '433–438',
      pageCount: 6,
      hours: '4–6 小时',
      quizzes: 6,
      figures: 3,
      status: 'ready'
    }
  ],

  /* ---------- 预留位：计划中 / 待补充的内容 ----------
   * 这里的内容会以「待更新」的灰色卡片出现在首页，
   * 提示后续可以扩展的方向。等真正做好一讲，
   * 把它从 planned 移到 lessons 即可。 */
  planned: [
    {
      id: 'book-main',
      title: '原书正文精讲',
      subtitle: '第 1–15 章：从线性模型到强化学习',
      note: '附录是「字典」，正文才是「故事」。学完数学基础后，可以按同样的方式精读正文各章。'
    },
    {
      id: 'practice',
      title: '配套练习与代码',
      subtitle: 'NumPy 手写线性回归 / Softmax 回归 / 反向传播',
      note: '把每一讲的公式落到代码上，用「跑起来」来检验是否真的理解。'
    },
    {
      id: 'cheatsheet',
      title: '公式速查表',
      subtitle: '把五讲的核心公式压缩成一张可打印的对照表',
      note: '复习与考前检索用；同样由 site-data.js 驱动。'
    }
  ]
};
