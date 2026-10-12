# XHS Poster · JEV 图文预览

包含五套论文推广稿 A4-1-1～A4-1-5，以及四套论文解读稿 A1-3、A2-3、A2-4、A3-2。

- 65 张 1500×2000 原尺寸 PNG，可逐张保存。
- 完整发布文案，支持直接复制。
- 各版本 ZIP、全部图文 ZIP 和 27 页横版汇总 PDF。
- 每个版本和 PDF 页眉均区分「论文推广／论文解读」。

## Cloudflare Pages 部署

在 **Workers & Pages → Create application → Pages → Import an existing Git repository** 中选择此仓库。

| 参数 | 填写值 |
| --- | --- |
| Project name | `xhs-poster`（若重名可换） |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | 留空，使用仓库根目录 |
| Environment variables | 无需设置 |

这是已经生成的静态网站，没有依赖安装、API 服务、数据库或 Worker 部署命令。
部署完成后，以 Cloudflare 实际返回的 `*.pages.dev` 地址为准。后续推送到 `main` 将触发 Pages 自动部署。

文档：[静态 HTML 部署](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)、[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[资源限制](https://developers.cloudflare.com/pages/platform/limits/)。
导出脚本会检查单文件不超过 25 MiB。

## 本地预览

```sh
python -m http.server 8787 --bind 127.0.0.1 --directory public
```

打开 `http://127.0.0.1:8787/`。使用 HTTP 服务预览，保留网站绝对路径和文案复制功能。

## 更新内容

`public/` 为已经导出的正式站点，部署不需要重跑导出脚本。
若拥有原始制作目录，可更新后执行：

```sh
python scripts/export-preview.py --source /path/to/JEV-论文内容制作
```

脚本只导出当前九个版本的正式图片、文案和下载文件，不包含制作记录、旧版本、临时检查结果或账号信息。
预览的 robots 配置关闭搜索引擎收录，不构成访问控制。

## 论文来源

Fan Zhang 等，*Same Scores, Different Decisions: Evaluating JEV and Language Models for Legal Document Understanding*，arXiv:2609.27678v1，2026-09-23，预印本，CC BY 4.0。

[原论文](https://arxiv.org/abs/2609.27678) · [论文代码](https://github.com/ZF-Utokyo/Jev-Benchmark)

评测任务是根据合同原文回答问题；文中的成本、准确率与响应时间对应论文所测版本和配置。品牌标识用于指明所讨论的模型，权利归各权利人所有。
