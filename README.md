# Paper Post · JEV 图文预览 V2

包含五套论文推广稿 A4-1-1～A4-1-5，以及四套论文解读稿 A1-3、A2-3、A2-4、A3-2。

- 65 张 1500×2000 原尺寸 PNG，可逐张保存。
- 完整发布文案，支持直接复制。
- 各版本 ZIP、全部图文 ZIP 和 27 页横版汇总 PDF。
- 每个版本和 PDF 页眉均区分「论文推广／论文解读」。

## V2 阅读界面与初版保留

- `/`：V2，浅色双列图文流、推广/解读切换、搜索、滑图详情、收藏与发布文案复制。桌面端使用侧边导航和多列图文流。
- `/v1/`：保留初版的多图总览与全部详情页；V2 菜单和桌面侧栏提供「切回初版预览」。
- 初版的 65 张发布图、9 份文案、所有既有 ZIP 和 27 页 PDF 均未修改，两版共用原始文件。
- 旧版 `/versions/.../` 链接可继续打开对应的 V2 图文；初版详情在 `/v1/versions/.../`。
- 收藏只保存在当前浏览器，不需要账户。分享链接直接打开对应版本。
- 「混合浏览」将五版论文推广与四版论文解读穿插展示，手机入口为底部「收藏」。初次进入时每组两篇左右交替；标识文字为「红」。
- 手机端在图文列表顶部下拉、松手可随机重排当前列表，支持连续刷新；短距离下拉取消。刷新不改变当前分类、搜索条件或收藏状态，进入详情再返回也会保留刚才的顺序。

初版 Git 标签：`v1.0.0`，对应 `58f7d4c033c802879dcd1a7bdaeb90a5ae76b52d`。V2 合并使用单独的合并提交，并标记 `v2.0.0`。

需要把线上站点完整回退到初版时，在干净的工作目录执行以下命令。它会新增一笔撤销提交、保留 Git 历史，并在推送后触发 Pages 部署：

```sh
git switch main
git pull --ff-only origin main
git restore --source=v1.0.0 --staged --worktree -- .
git commit -m "Restore original V1 preview"
git push origin main
```

此操作会把仓库中已跟踪的文件完整恢复到初版，包括撤销后续 V2 更新，因此只在确认需要整站回退时执行。只想查看初版，无需回退部署，直接打开 `/v1/`。

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

V2 的界面源文件位于 `web/`。修改界面后执行以下命令，同步到 `public/`，不会重新生成图片或下载包：

```sh
python scripts/build-ui.py
node scripts/check-v2.cjs
```

浏览器检查需要本地可用的 Playwright 与 Chrome（可通过 `CHROME_PATH` 指定）。脚本自行启动临时本地服务，检查滑图、复制、搜索、收藏、旧链接、初版入口、页面宽度及原始素材哈希，截图和报告写入不提交的 `checks/`。

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
