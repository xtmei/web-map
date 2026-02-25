# Stalingrad Hex Wargame Prototype

PR1 delivered a **Hex Playground** foundation using **Vite + Vanilla TypeScript + HTML Canvas 2D**.
PR2 extended that playground with **unit tokens and selection**.
PR3 adds **mobile-first controls, controllable formation filtering, and a selected-unit bottom sheet**.

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

## PR2 Scope (Unit Tokens + Selection)

Implemented:
- Minimal `Unit` model with side/echelon/strength/morale/axial position
- Demo units (Axis + Soviet) rendered as canvas tokens
- Side-distinct token shapes (Axis square-ish, Soviet circle-ish)
- Unit hit-testing and selection on click/tap
- Selected unit highlight ring
- Unit-first selection priority (unit tap selects unit and its hex)
- Empty-hex tap clears selected unit and selects hex
- HUD now shows selected hex plus detailed selected unit info

## PR3 Scope (Controls + Formation Filter + Bottom Sheet)

Implemented:
- Mobile-friendly top controls (Axis/Soviet side toggle + formation dropdown + clear button)
- Formation-aware unit control model (`formationId`, `formationName`)
- Side switch auto-selects first formation for that side and clears selected unit
- Only selected-formation units are selectable; others remain visible but disabled/greyed
- Bottom sheet unit panel with unit details and derived structure placeholders
- Tapping empty hex still clears selected unit and selects that hex

## PR1 Manual QA Checklist

- [ ] **A) Grid render**: Launch app and verify fullscreen canvas displays pointy-top hex map with substantial playable area.
- [ ] **B) Pan**: Drag with mouse or one finger; map pans smoothly.
- [ ] **C) Zoom**: Use wheel/trackpad pinch to zoom in/out and confirm zoom anchors around cursor/touch center and stays within sensible min/max.
- [ ] **D) Select**: Click/tap a hex; selected hex gains highlight and remains selected while panning/zooming.
- [ ] **E) HUD**: Verify HUD (top-left) updates selected axial coordinates and shows control hints.

## PR2 Manual QA Checklist

1. App runs: `npm install && npm run dev`
2. Units are visible on the grid (6–12 tokens).
3. Clicking/tapping a unit selects it and highlights its token.
4. HUD updates to show selected unit info.
5. Clicking/tapping an empty hex clears unit selection and selects that hex.
6. Pan/zoom still works on desktop and mobile touch without breaking selection.

## PR3 Manual QA Checklist

1. `npm install && npm run dev` works.
2. Top bar shows Side toggle + Formation dropdown.
3. Switching Side updates Formation options and filters controllable units accordingly.
4. Only units in the selected Formation are selectable; others are disabled/greyed.
5. Selecting a controllable unit opens bottom sheet and shows correct info (name/side/echelon/strength/morale/pos).
6. Tapping empty hex closes panel (unit deselected) and selects hex.
7. Pan/zoom still works; UI clicks do not accidentally pan the map.

## Roadmap

- **PR4 (next):** movement + path preview for selected controllable units (not implemented in PR3).
