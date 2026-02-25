# Stalingrad Hex Wargame Prototype

PR1 delivered a **Hex Playground** foundation using **Vite + Vanilla TypeScript + HTML Canvas 2D**.
PR2 extends that playground with **unit tokens and selection**.

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

Not in PR2:
- Movement
- Combat
- OOB hierarchy UI
- Unit bottom sheet panel

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

## PR3 Plan (not implemented)

- Add a mobile-friendly bottom sheet panel for selected unit details/actions.
- Keep canvas interaction model from PR2 while surfacing unit metadata in the sheet.
- Wire panel visibility to selected unit state (no movement/combat yet).
