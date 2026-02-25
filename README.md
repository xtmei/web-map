# Stalingrad Hex Wargame Prototype

PR1 delivers a **Hex Playground** foundation using **Vite + Vanilla TypeScript + HTML Canvas 2D**.

## Run

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```

## PR1 Scope (Hex Playground)

Implemented:
- Fullscreen pointy-top axial hex grid (disc map, radius 21)
- Pointer/touch drag panning
- Wheel + pinch zoom centered on cursor/focus point with clamps
- Tap/click hex selection with selected highlight
- Top-left HUD showing selected `(q, r)` and controls hint

Not in PR1:
- Units, OOB, combat, terrain layers, scenario loading

## PR1 Manual QA Checklist

- [ ] **A) Grid render**: Launch app and verify fullscreen canvas displays pointy-top hex map with substantial playable area.
- [ ] **B) Pan**: Drag with mouse or one finger; map pans smoothly.
- [ ] **C) Zoom**: Use wheel/trackpad pinch to zoom in/out and confirm zoom anchors around cursor/touch center and stays within sensible min/max.
- [ ] **D) Select**: Click/tap a hex; selected hex gains highlight and remains selected while panning/zooming.
- [ ] **E) HUD**: Verify HUD (top-left) updates selected axial coordinates and shows control hints.

## Roadmap (Next PRs, not implemented)

- **PR2: Unit tokens + selection**
  - Load small demo unit list (hardcoded/JSON)
  - Render unit tokens on hexes
  - Tap unit selects it; show minimal unit tooltip/HUD

- **PR3: Unit panel (bottom sheet) + formation selection**
  - Bottom sheet with selected unit placeholders
  - Side selection (Axis/Soviet)
  - Controllable formation selection (one Army)

- **PR4: Movement + path preview**
  - Action points and placeholder blocked terrain
  - Tap destination previews path
  - Confirm move button

- **PR5: Combat resolution (simple)**
  - Adjacent attack with CRT-like odds + d6
  - Apply strength/morale losses

- **PR6: Terrain layers + rivers/roads**
  - Per-hex terrain affecting move/combat
  - Minimal legend toggle

- **PR7: OOB hierarchy navigation**
  - Army → Corps → Division → Regiment → Battalion navigation UI

- **PR8: Save/load + basic AI**
  - Save/load game state via localStorage
  - Simple AI movement toward objectives and favorable attacks
