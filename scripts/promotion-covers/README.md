# 2026-10-21 未发布推广首图

来源：`JEV-论文内容制作/标题同步-20261016` 的 Canvas 排版代码、论文首页原图和 Table 4 数据。此目录保存独立副本，旧制作版本不改动。

`source.json` 保存 12 个未发布推广版本的原内容、原布局及配色。背景使用研究蓝、鼠尾草绿、陶土粉；论文截图与图表数据保留原貌。

在仓库根目录运行 `node scripts/promotion-covers/render.cjs`，生成 1500×2000 PNG、PDF 用 JPEG、文字边界与原图位置记录，输出至不提交的 `checks/20261021/covers`。依赖 Codex Node runtime 的 `@napi-rs/canvas` 与现有 Windows 字体，路径在渲染脚本中声明。

运行 `python scripts/promotion-covers/apply-release.py` 应用这次发布：替换对应首图和 ZIP 内的同名首图，保留其余 ZIP 项；替换 58 页汇总 PDF 中的 12 个封面图片对象，保留文字、版面和其他图片；将 A4-4、A4-5、A4-8 的 `published` 标为 `true`。Python 需要 PyMuPDF。备份位于 `checks/20261021/baseline`。

网站 UI 源文件仍是 `web/app.js` 与 `web/style.css`。状态来自 `public/site-data.json`，重新构建 UI 时保留该字段。
