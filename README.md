# Mobile Campaign Map MVP 1.0

移动端优先地图原型：首屏直接进入地图，支持 8 阶段时间轴播放、单位点选、单位卡、战线/控制区 GeoJSON 叠加。

## 本地预览

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 功能说明

- **地图首屏**：Leaflet + OSM 底图，地图视图高度 >= 70% 视口。
- **Top Bar**：阶段、阵营切换、简化 AP、补给摘要、日志按钮。
- **时间轴**：`1942-07` 到 `1943-02`，支持拖动和播放/暂停。
- **Bottom Sheet**：默认收起显示单位摘要；展开显示单位详情（编制/装备/状态/上级/AP）。
- **FAB 组**：居中、定位单位、回合结束；长按居中按钮可弹阶段跳转列表。
- **地图图层**：单位点位（简化 NATO SVG 样式）、战线/控制区（GeoJSON）、目标点（objectives）。
- **移动端适配**：44px 触控热区、safe-area、横竖屏布局切换（横屏 sheet 侧栏化）。
- **性能策略**：按缩放阈值过滤单位显示（低缩放仅 Army/Corps，高缩放显示全部）。

## 代码结构（模块化）

- `src/main.ts`：应用入口与初始化。
- `src/store/state.ts`：状态管理与派生数据。
- `src/data-loader/`：数据类型与分阶段数据加载。
- `src/map/map-view.ts`：Leaflet 地图、单位/战线/目标图层。
- `src/ui/layout.ts`：Top Bar、Time Slider、Bottom Sheet、FAB 交互。

## 数据格式

### 1) `public/data/phases.json`

阶段元数据数组：

```json
[
  {
    "id": 1,
    "label": "1942-07",
    "title": "阶段1: ...",
    "description": "...",
    "range": "1942-07"
  }
]
```

### 2) `public/data/units_phase_01.json` ... `units_phase_08.json`

单位数组字段：

- `id`: string
- `name`: string
- `side`: `Axis | Soviet`
- `echelon`: `Army | Corps | Division | Regiment | Battalion`
- `lat`, `lon`: number
- `strength`: number
- `equipment`: string[]
- `parentId`: string
- `ap`: number
- `supply`: `Good | Stretched | Low`

### 3) `public/data/frontline_phase_01.geojson` ... `frontline_phase_08.geojson`

`FeatureCollection`，支持：

- `LineString`：战线
- `Polygon`：控制区

示例 `properties`：

- `side`: `Axis | Soviet`
- `name`: 图层名称

### 4) `public/data/objectives.geojson`

关键目标点 `FeatureCollection<Point>`，`properties`：

- `name`
- `type`
- `vp`
