# 斯大林格勒战役 Web 地图系统（高清底图 + 可计算地形）

本改造将地图从“静态图片背景”升级为可复现的数据管线与运行时地图模块：

- **高清历史底图 overlay**（优先 LoC IIIF + Leaflet-IIIF，可缩放到街区级）。
- **GeoJSON 矢量层**（roads / railways / river / industrial_zones / elevation_points / bridges / ferry_crossings）。
- **投影坐标中生成 hex grid**（支持 `--hex-size 250` / `500`，每格含 terrain、move_cost、cover、los_block、supply）。

## 目录结构

```txt
/data
  /rasters     # 原始地图、IIIF manifest、配准输入
  /tiles       # XYZ tiles 输出
  /vector      # 矢量层 GeoJSON
  /hex         # 生成后的 hex GeoJSON
/scripts
  pipeline.py  # 一键数据管线
/src
  /map
    mapRuntime.js   # Leaflet + IIIF + vector + hex 运行时
  /sim
```

## 数据源优先级

在 `data/rasters/sources.json` 中登记了优先数据源：

1. **A. Library of Congress Stalingrad-Süd (1:25,000)**（IIIF Manifest + JPEG2000/TIFF）。
2. **B. EtoMesto 已地理配准地图与 1942 航拍**（overlay fallback / 控制点参考）。
3. **C. Indiana University DataCORE 1:100,000**（战役大范围底图）。

## 本地一键流程

### 1) 下载 LoC 的 IIIF Manifest + 生成 hex

```bash
python3 scripts/pipeline.py all --hex-size 500
```

### 2) 仅生成 hex（可切换 250m）

```bash
python3 scripts/pipeline.py generate-hex --hex-size 250
python3 scripts/pipeline.py generate-hex --hex-size 500
```

### 3) 由已配准 raster 生成 XYZ 瓦片

```bash
python3 scripts/pipeline.py build-tiles --input data/rasters/stalingrad_south_georef.tif
```

> `build-tiles` 依赖 `gdal2tiles.py`；若未安装 GDAL，可改用 Allmaps Tile Server。

## 地理配准（推荐）

### 方案 A：Allmaps（优先，适配 IIIF）

1. 打开 Allmaps Editor，对 LoC IIIF 图进行控制点配准。
2. 导出 georeference annotation / transformed 输出。
3. 使用 Allmaps Tile Server 将其发布为 XYZ（或可直接被 web 叠加）。
4. 把输出放入 `data/tiles/...`，运行时替换 `src/map/mapRuntime.js` 中对应图层 URL。

### 方案 B：已配准源直接接入

- 可直接用 EtoMesto 的配准图作为临时 overlay。
- 也可以下载到本地并通过 GDAL 统一切片入 `data/tiles`。

## 运行时加载

- 打开页面后点击 **“高清地图”**。
- 会进入 Leaflet 工作台，叠加：
  - OSM（低透明度参考）；
  - LoC IIIF 历史底图；
  - GeoJSON 战场要素；
  - Hex 网格（按缩放级别裁剪渲染，移动端更流畅）。

## 手机端性能策略

已实现：

- `preferCanvas` 渲染与缩放级别裁剪（hex 仅在中高 zoom 显示）。
- `keepBuffer` 控制瓦片缓存，降低拖拽抖动。
- 分层加载（先底图，再异步矢量 + hex）。

建议继续：

- 将 hex 按 z/x/y 或战区分块；
- 使用 Service Worker 缓存热点瓦片；
- 对矢量层按视野 bbox 请求（后端切片或 PMTiles）。
