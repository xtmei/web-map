import type { DataBundle, PhaseMeta, Side, UnitRecord } from '../data-loader/types';

export interface AppState {
  phaseIndex: number;
  selectedUnitId: string | null;
  side: Side;
  playing: boolean;
  sheetOpen: boolean;
  zoom: number;
}

export interface DerivedState {
  phase: PhaseMeta;
  units: UnitRecord[];
  selectedUnit: UnitRecord | null;
  frontline: any;
  apSummary: string;
  supplySummary: string;
}

export class GameStore {
  private listeners = new Set<() => void>();

  readonly state: AppState = {
    phaseIndex: 0,
    selectedUnitId: null,
    side: 'Soviet',
    playing: false,
    sheetOpen: false,
    zoom: 7
  };

  constructor(private readonly data: DataBundle) {}

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getDerived(): DerivedState {
    const phase = this.data.phases[this.state.phaseIndex];
    const units = this.data.unitsByPhase.get(phase.id) ?? [];
    const frontline =
      this.data.frontlineByPhase.get(phase.id) ?? ({ type: 'FeatureCollection', features: [] } as any);
    const selectedUnit = units.find((unit) => unit.id === this.state.selectedUnitId) ?? null;
    const filtered = units.filter((unit) => unit.side === this.state.side);
    const avgAp = filtered.length
      ? (filtered.reduce((sum, unit) => sum + unit.ap, 0) / filtered.length).toFixed(1)
      : '0';
    const lowSupply = filtered.filter((unit) => unit.supply !== 'Good').length;

    return {
      phase,
      units,
      selectedUnit,
      frontline,
      apSummary: `${avgAp} AP`,
      supplySummary: `${lowSupply}/${filtered.length} strained`
    };
  }

  setPhaseByIndex(index: number): void {
    const clamped = Math.min(Math.max(index, 0), this.data.phases.length - 1);
    this.state.phaseIndex = clamped;
    this.state.selectedUnitId = null;
    this.state.sheetOpen = false;
    this.notify();
  }

  setSelectedUnit(unitId: string | null, openSheet = true): void {
    this.state.selectedUnitId = unitId;
    this.state.sheetOpen = Boolean(unitId) && openSheet;
    this.notify();
  }

  setSheetOpen(open: boolean): void {
    this.state.sheetOpen = open;
    this.notify();
  }

  togglePlay(): void {
    this.state.playing = !this.state.playing;
    this.notify();
  }

  setSide(side: Side): void {
    this.state.side = side;
    this.notify();
  }

  stepPhaseForward(): void {
    const next = (this.state.phaseIndex + 1) % this.data.phases.length;
    this.setPhaseByIndex(next);
  }

  setZoom(zoom: number): void {
    this.state.zoom = zoom;
  }

  get objectives() {
    return this.data.objectives;
  }

  get phases() {
    return this.data.phases;
  }
}
