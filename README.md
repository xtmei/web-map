# Stalingrad Hex Wargame Prototype

PR1 delivered a **Hex Playground** foundation using **Vite + Vanilla TypeScript + HTML Canvas 2D**.
PR2 extended that playground with **unit tokens and selection**.
PR3 adds **mobile-first controls, controllable formation filtering, and a selected-unit bottom sheet**.
PR4 adds **movement points, move mode, reachable range overlays, path preview, confirm/cancel move flow, and end turn MP reset**.
PR5 adds a **combat MVP** with attack mode, adjacent target preview, d6 + odds CRT resolution, and combat log feedback.

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

- **PR6 (next):** retreat movement rules, ZOC/stacking limits, and optional opportunity fire.


## PR4 Notes

- Units now have `mpMax` and `mpRemaining`. If missing in scenario `units.json`, defaults are: Battalion=6, Regiment=5, Division=4, all other echelons=4.
- End Turn currently resets MP for all units on the currently selected side (single-player handoff style).
- Cancel in move mode clears the preview and exits move mode without moving the unit.

## PR4 Manual QA Checklist

1. App runs: `npm install && npm run dev`
2. Select a controllable unit: HUD/panel shows `mpMax/mpRemaining`.
3. Tap **Move**: reachable hexes highlight.
4. Tap a reachable hex: path preview appears and move cost is displayed in HUD.
5. Tap **Confirm Move**: unit moves to destination and `mpRemaining` decreases by path cost.
6. Unit cannot move across blocked river edges from `riverEdge` data.
7. Tap **End Turn**: MP resets for currently controlled side units; move preview/path clears; pan/zoom/touch still works.
8. Units outside selected formation remain non-interactable as before.


## PR5 Notes

- New **Attack** mode lets selected controllable units target adjacent enemy units.
- Confirm Attack resolves combat using odds buckets (`1:2`, `1:1`, `2:1`, `3:1`) and a d6 CRT result (`DE`, `DR`, `EX`, `AR`).
- Combat outcomes currently apply lightweight attrition/morale effects and write to HUD combat log.
- This is intentionally a compact MVP to validate the combat loop before adding retreats/ZOC/op-fire.
