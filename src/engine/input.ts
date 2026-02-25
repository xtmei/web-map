import type { Unit } from '../game/units/model';
import type { Camera } from './camera';
import type { Axial, Point } from './hex/coords';
import { axialToPixel, pixelToAxial } from './hex/coords';

interface InputHandlers {
  onTap: (payload: { hex: Axial; unit: Unit | null }) => void;
}

interface InputOptions {
  getUnits: () => Unit[];
  getUnitHitRadius: () => number;
}

export class InputController {
  private activePointers = new Map<number, PointerEvent>();
  private dragOrigin = new Map<number, { x: number; y: number }>();
  private pinchDistance: number | null = null;
  private didPan = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly hexSize: number,
    private readonly handlers: InputHandlers,
    private readonly options: InputOptions
  ) {
    this.bind();
  }

  private bind(): void {
    this.canvas.addEventListener('pointerdown', (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.activePointers.set(event.pointerId, event);
      this.dragOrigin.set(event.pointerId, { x: event.clientX, y: event.clientY });
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.activePointers.has(event.pointerId)) {
        return;
      }

      const previous = this.activePointers.get(event.pointerId);
      this.activePointers.set(event.pointerId, event);
      if (!previous) {
        return;
      }

      if (this.activePointers.size === 1) {
        const dx = event.clientX - previous.clientX;
        const dy = event.clientY - previous.clientY;
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          this.didPan = true;
          this.camera.panBy(dx, dy);
        }
        return;
      }

      const pointers = Array.from(this.activePointers.values());
      const [a, b] = pointers;
      if (!a || !b) {
        return;
      }
      const nextDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (this.pinchDistance !== null && this.pinchDistance > 0) {
        const factor = nextDistance / this.pinchDistance;
        const centerX = (a.clientX + b.clientX) / 2;
        const centerY = (a.clientY + b.clientY) / 2;
        this.camera.zoomAt(centerX, centerY, factor);
        this.didPan = true;
      }
      this.pinchDistance = nextDistance;
    });

    this.canvas.addEventListener('pointerup', (event) => {
      const origin = this.dragOrigin.get(event.pointerId);
      const wasTap = this.isTap(origin, event) && !this.didPan;

      this.activePointers.delete(event.pointerId);
      this.dragOrigin.delete(event.pointerId);
      this.pinchDistance = this.activePointers.size >= 2 ? this.pinchDistance : null;

      if (this.activePointers.size === 0) {
        this.didPan = false;
      }

      if (wasTap) {
        const rect = this.canvas.getBoundingClientRect();
        const world = this.camera.screenToWorld({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
        const hex = pixelToAxial(world, this.hexSize);
        const unit = this.hitTestUnit(world);
        this.handlers.onTap({ hex, unit });
      }
    });

    this.canvas.addEventListener('pointercancel', (event) => {
      this.activePointers.delete(event.pointerId);
      this.dragOrigin.delete(event.pointerId);
      if (this.activePointers.size === 0) {
        this.didPan = false;
      }
    });

    this.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const direction = Math.sign(event.deltaY);
        const factor = direction > 0 ? 0.92 : 1.08;
        this.camera.zoomAt(x, y, factor);
      },
      { passive: false }
    );
  }

  private isTap(
    origin: { x: number; y: number } | undefined,
    event: PointerEvent
  ): boolean {
    if (!origin) {
      return false;
    }

    const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    return distance < 8;
  }

  private hitTestUnit(world: Point): Unit | null {
    const units = this.options.getUnits();
    const hitRadius = this.options.getUnitHitRadius();
    let closest: Unit | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const unit of units) {
      const center = axialToPixel(unit.pos, this.hexSize);
      const distance = Math.hypot(world.x - center.x, world.y - center.y);
      if (distance <= hitRadius && distance < closestDistance) {
        closest = unit;
        closestDistance = distance;
      }
    }

    return closest;
  }
}
