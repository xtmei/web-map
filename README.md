# 城市局部·班为单位 回合制战术游戏（MVP）

一个移动端优先、浏览器可运行的城市街区战术 demo。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 操作说明（MVP）

- 点选蓝色单位（玩家班）进行操作。
- 顶部条显示：回合、阵营、选中班、AP、压制。
- 底部动作条支持：移动、射击、蹲伏、手雷、结束行动。
- 点击 **结束玩家回合** 后进入 AI 回合（AI 会移动并射击），随后返回玩家回合。
- 胜利条件：
  - 任一方占领目标点（黄色格）
  - 或歼灭对方所有班

## 地图与规则

- 60x60 方格地图（每格近似 10m）
- LOS：建筑/墙体阻挡（blocked=true 的格子阻断射线）
- 掩体：cover=0/1/2 影响命中
- 压制：受火力影响后上升，回合开始会降低 AP（最少保留2AP）
- 地图包含：道路、建筑块、瓦砾、围墙

## 工程结构

```text
src/
  map/    # 网格、LOS、渲染
  sim/    # 回合、动作、AI、胜利判定
  ui/     # 顶部条、动作条、Bottom Sheet
  data/   # 场景加载和类型定义
public/scenarios/<name>/
  grid.json
  map.svg
```

## 数据格式（`/public/scenarios/<name>/grid.json`）

```json
{
  "id": "city_block_mvp",
  "name": "城市街区MVP",
  "objective": { "x": 30, "y": 30 },
  "gridTemplate": {
    "width": 60,
    "height": 60,
    "base": { "terrain": "open", "cover": 0, "height": 0, "blocked": false },
    "features": [
      { "x": 0, "y": 28, "w": 60, "h": 4, "terrain": "road", "cover": 0, "height": 0, "blocked": false }
    ]
  },
  "units": []
}
```

`features` 用矩形批量描述地形，运行时展开为完整网格数据。
