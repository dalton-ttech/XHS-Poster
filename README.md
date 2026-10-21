# Paper Post · Jev 图文预览

19 组完整图文：A4-1～A4-10、原排版 A4-1-1～A4-1-5，以及 A1-3、A2-3、A2-4、A3-2。

- 154 张 1500×2000 原图，19 份可复制文案。
- 58 页横版汇总 PDF，每页多图，附完整可选择复制的文字。
- A4-4、A4-5、A4-8 已由合作博主发布：卡片悬停或键盘聚焦显示「已发布 不可选中」，触屏直接显示；不可打开、收藏或在发布文案中选中。
- 其余 12 个论文推广版本的首图改为蓝、绿、陶土粉底色，保留各自布局、标题与论文原图；下载包和汇总 PDF 同步更新。
- A4-5 展示 Table 4 节选；A4-7 据该表绘制题数对比，横轴为 0—93，沿用原论文颜色。
- A2-4 保留银色 Clippit。对外图片不含内部版本、制作日期或修订说明；原创文案统一使用 Jev。

## 预览与下载

| 路径 | 内容 |
| --- | --- |
| `/` | 浅色移动端图文流、搜索、滑图、文案复制、收藏 |
| `/covers.html` | A4 十版首图对比 |
| `/downloads/` | 完整素材下载入口，两个独立 ZIP 包合计覆盖全部图文 |
| `/previous/` | 此前线上九版 V2 预览，原图片、文案与下载文件保留 |
| `/v1/` | 初版多图总览；原始素材取自 `/previous/` |

底部「收藏」将推广和解读穿插显示。列表顶部下拉可随机排列当前列表，保持分类、搜索及收藏状态；详情返回保持排列结果。

图片、文案和单版下载包相互对应。下载入口分为 A4 十版（80 张）与其余九版（74 张），两包可以分别解压，无需拼接。PDF 复用重复图片对象，不降低图片分辨率；所有网站文件小于 25 MiB。

## Cloudflare Pages

| 参数 | 值 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | 留空 |
| Environment variables | 无 |

`public/` 是预生成的静态网站，无需安装依赖或调用 API。实际域名与部署结果以 Cloudflare 返回值为准。

参考：[静态 HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)、[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[资源限制](https://developers.cloudflare.com/pages/platform/limits/)。

## 回退

初版标签 `v1.0.0` 对应 `58f7d4c033c802879dcd1a7bdaeb90a5ae76b52d`。本次内容更新前的回退点为 `v2-before-a4-integration`，对应 `94ca2566fa054affecfb75528389a5c7a3ff9127`。

只查看旧稿可直接访问 `/previous/` 或 `/v1/`，无需回退整站。

需要整站回退时，在干净的工作目录选择上述标签，恢复后新增提交并推送，保留历史：

```sh
git switch main
git pull --ff-only origin main
git restore --source=v2-before-a4-integration --staged --worktree -- .
git commit -m "Restore preview before A4 integration"
git push origin main
```

## 本地检查与维护

```sh
python -m http.server 8787 --bind 127.0.0.1 --directory public
```

界面源文件位于 `web/`。修改后运行 `python scripts/build-ui.py`，只同步界面和文案索引，不重新绘制图片。

运行 `node scripts/check-v2.cjs` 检查原稿归档哈希、19 组图片、复制、搜索、滑图、连续下拉刷新、下载链接和移动端宽度。需要 Playwright 和 Chrome；Chrome 路径可通过 `CHROME_PATH` 指定。检查结果写入不提交的 `checks/`。

`scripts/import-release.py --source <release-dir>` 核验并暂存独立制作目录中的 `site/`，同步对应 `web/` 源文件，输出到 `checks/public-next`。审阅暂存目录后再替换 `public/`；替换前应备份原目录。

早期 `scripts/export-preview.py` 仅对应初始九版来源，不应用来覆盖当前内容。

## 论文来源

Fan Zhang 等，*Same Scores, Different Decisions: Evaluating JEV and Language Models for Legal Document Understanding*。

[原论文](https://arxiv.org/abs/2609.27678) · [论文代码](https://github.com/ZF-Utokyo/Jev-Benchmark)

评测任务是根据合同原文回答问题；成本、准确率与响应时间对应论文所测版本和配置，不代表完整合同审批成本。原论文截图保留原貌。
