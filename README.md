# 游园活动 — 数学24点小游戏

一个纯前端的数学 24 点游戏，适用于校园游园活动。

## ✨ 功能特点

- **数学24点**：每轮发 4 张牌，用加减乘除凑出 24
- **3 次尝试**：每轮限制 3 次输入机会
- **表达式校验**：必须用完 4 张牌，允许括号，支持中间小数
- **主题切换**：支持深色/浅色主题
- **响应式布局**：适配手机和桌面端
- **零依赖**：纯原生 HTML/CSS/JavaScript

## 🚀 快速开始

### 直接打开

双击 `app.html` 即可在浏览器中使用。

### Docker 部署

```bash
docker compose up -d
# 访问 http://localhost:8082
```

## 📁 项目结构

```
math24-cat_game/
├── app.html                    # 主页面
├── assets/
│   ├── css/main.css            # 全局样式
│   └── js/
│       ├── router.js           # 简易 Hash 路由
│       ├── app.js              # 主应用逻辑
│       └── games/24.js         # 数学24点游戏引擎
├── Dockerfile                  # Docker 镜像配置
├── docker-compose.yml          # Docker Compose 编排
└── README.md                   # 项目说明
```

## 🎮 游戏规则

1. 每轮发 4 张牌（数字 1-13，对应 A-K）
2. 使用 `+`、`-`、`*`、`/` 和括号组合这 4 个数
3. 最终结果需等于 24（四舍五入至 6 位小数后比较）
4. 每轮有 3 次尝试机会

## License

MIT
