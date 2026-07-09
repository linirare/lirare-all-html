# gh.lirare.xyz

游戏社群数据分析与产品优化报告集 — 静态站点。

## 项目结构

每个独立页面放在单独的子目录中，通过 `gh.lirare.xyz/目录名/` 访问。

```
/
├── index.html              # 首页 → gh.lirare.xyz/
├── suggestions.html        # 产品建议 → gh.lirare.xyz/suggestions.html
├── chat-report/            # 群聊分析 → gh.lirare.xyz/chat-report/
├── chat-analysis/          # 区服分析 → gh.lirare.xyz/chat-analysis/
├── game-report/            # 游戏报告 → gh.lirare.xyz/game-report/
├── game-report-v2/         # 游戏报告 v2 → gh.lirare.xyz/game-report-v2/
├── garden-analysis/        # 花园分析 → gh.lirare.xyz/garden-analysis/
├── market-weekly/          # 市场周报 → gh.lirare.xyz/market-weekly/
├── minigame-weekly/        # 小游戏周报 → gh.lirare.xyz/minigame-weekly/
├── yiqi-zhi-di-game-intro/ # 遗弃之地游戏介绍 → gh.lirare.xyz/yiqi-zhi-di-game-intro/
├── zhenghe-ppt/            # 整合 PPT → gh.lirare.xyz/zhenghe-ppt/
├── zhenxiesi-analysis/     # 真写死分析 → gh.lirare.xyz/zhenxiesi-analysis/
└── ...
```

### 规则

- 子目录必须包含 `index.html`，才能通过 `/目录名/` 访问
- 不带 `index.html` 的目录会返回 404
- 首页 `index.html` 放在根目录

## 部署

通过 GitHub Pages 自动部署，push 到 `master` 分支即可。

```bash
git add .
git commit -m "type: message"
git push
```

部署后约 1-2 分钟生效。

## 域名

`gh.lirare.xyz` → CNAME → `liniare.github.io`（HTTPS 自动启用）
