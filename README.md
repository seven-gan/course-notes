# 研一课程学习站

深度学习数学基础讲义（5 讲）与本学期课程大纲总览。纯静态网站，无需构建。

## 在线访问

启用 GitHub Pages 后：

- 落地页：`https://<你的用户名>.github.io/course-notes/`
- 完整版：`https://<你的用户名>.github.io/course-notes/course-hub.html`
- 讲义版：`https://<你的用户名>.github.io/course-notes/nndl-math-notes/`

## 目录结构

```
.
├── index.html              落地页
├── course-hub.html         完整版（课程总览 + 5 讲，字体内嵌，单文件）
├── nndl-math-notes/        讲义版（多文件，资源可缓存）
│   ├── index.html
│   ├── nndl-math-notes.html          学习路线图
│   ├── lesson-01-linear-algebra.html
│   ├── lesson-02-calculus.html
│   ├── lesson-03-optimization.html
│   ├── lesson-04-probability.html
│   ├── lesson-05-information-theory.html
│   └── _shared/            样式、脚本、字体
└── .nojekyll               禁用 Jekyll
```

## 关于 .nojekyll

**这个文件不能删。** GitHub Pages 默认用 Jekyll 处理站点，而 Jekyll 会忽略
以 `_` 开头的目录。`nndl-math-notes/_shared/` 一旦被忽略，讲义版的样式与字体
就会全部失效。`.nojekyll` 让 Pages 跳过 Jekyll，直接按原样发布。

## 内容说明

- 讲义：基于邱锡鹏《神经网络与深度学习》数学基础附录 A–E 的原创讲解与重排，
  公式编号与原书一致。属于学习笔记，不复制原书正文。
- 课程大纲：中国科学院大学本学期选课大纲（教学目的、章节、学时、教师姓名）。
- 公式采用浏览器原生 MathML 或内联标记排版，无第三方公式库依赖。

## 许可

个人学习用途。如需引用课程大纲内容，请以学校官方发布为准。
