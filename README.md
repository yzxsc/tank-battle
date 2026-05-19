# 🛡️ 坦克大战 Tank Battle

一个用纯 HTML5 + CSS + JavaScript 制作的经典坦克大战游戏，使用 Canvas 进行渲染。

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🎮 在线试玩

只需在浏览器中打开 `index.html` 即可开始游戏，无需任何依赖或构建步骤。

## ✨ 特色功能

- 🎨 **像素风格美术** — 复古怀旧的视觉效果
- 🎯 **4 种敌方坦克** — 普通、快速、装甲、重型坦克，各具不同属性
- 🗺️ **3 个关卡** — 难度递增的精心设计关卡
- ⭐ **5 种道具** — 升级、生命、护盾、炸弹、冰冻
- 💥 **粒子爆炸** — 流畅的爆炸和震屏效果
- 🦅 **基地保卫** — 经典的基地保护玩法
- 📈 **坦克升级** — 玩家坦克可升级 3 次，火力越来越强
- 🎵 **动态地形** — 砖墙可破坏、钢墙坚固、水面阻挡、草丛隐身

## 🎯 操作说明

| 按键 | 功能 |
|------|------|
| `W` `A` `S` `D` 或 `↑` `↓` `←` `→` | 移动坦克 |
| `空格` | 发射炮弹 |
| `P` | 暂停 / 继续 |
| `R` | 重新开始 |

## 🎪 游戏元素

### 坦克类型

| 类型 | 速度 | 血量 | 分数 | 特点 |
|------|------|------|------|------|
| 🟡 玩家坦克 | 快 | 1 | - | 可升级 |
| 🟤 普通坦克 | 慢 | 1 | 100 | 入门型 |
| ⚪ 快速坦克 | 极快 | 1 | 200 | 灵活 |
| 🟢 装甲坦克 | 中 | 2 | 300 | 多血量 |
| 🔴 重型坦克 | 慢 | 4 | 400 | 掉落道具 |

### 道具说明

| 道具 | 效果 |
|------|------|
| ⭐ 升级 | 增强坦克火力 |
| ❤️ 生命 | 增加 1 条生命 |
| 🛡️ 护盾 | 临时无敌状态 |
| 💣 炸弹 | 清除场上所有敌人 |
| ❄️ 冰冻 | 暂时冻结敌人 |

### 地形元素

- 🧱 **砖墙** — 可被炮弹破坏
- ⬜ **钢墙** — 普通炮弹无法破坏（需要升级到 3 级）
- 💧 **水面** — 阻挡坦克但子弹可穿过
- 🌿 **草丛** — 隐藏坦克
- 🦅 **基地** — 保护它! 一旦被摧毁游戏失败

## 📁 项目结构

```
tank-battle/
├── index.html      # 主 HTML 页面
├── style.css       # 样式文件
├── game.js         # 游戏核心逻辑
└── README.md       # 项目说明
```

## 🚀 快速开始

### 方法一：直接打开

双击 `index.html` 文件即可在默认浏览器中开始游戏。

### 方法二：本地服务器

如果想用本地服务器运行：

```bash
# Python 3
python -m http.server 8000

# Node.js (需要先安装 http-server)
npx http-server

# 然后访问 http://localhost:8000
```

## 🛠️ 技术栈

- **HTML5 Canvas** — 游戏渲染
- **原生 JavaScript** — 无框架依赖
- **CSS3** — 响应式 UI 设计

## 🎨 游戏架构

游戏采用面向对象设计，主要类包括：

- `Tank` — 坦克类（玩家和敌人共用）
- `Bullet` — 子弹类，处理移动和碰撞
- `Explosion` — 爆炸特效粒子系统
- `PowerUp` — 道具类
- `ScorePopup` — 分数弹出效果

主循环使用 `requestAnimationFrame` 实现流畅的 60FPS 渲染。

## 📜 许可证

MIT License — 自由使用、修改和分发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

享受游戏吧! 🎮
