export interface Vec2 {
  x: number;
  y: number;
}

export class Camera {
  public x = 0;
  public y = 0;
  public zoom = 1;

  constructor(
    private readonly minZoom = 0.45,
    private readonly maxZoom = 2.6
  ) {}

  panBy(deltaX: number, deltaY: number): void {
    this.x += deltaX;
    this.y += deltaY;
  }

  zoomAt(canvasX: number, canvasY: number, zoomFactor: number): void {
    const nextZoom = this.clampZoom(this.zoom * zoomFactor);
    const worldX = (canvasX - this.x) / this.zoom;
    const worldY = (canvasY - this.y) / this.zoom;

    this.zoom = nextZoom;
    this.x = canvasX - worldX * this.zoom;
    this.y = canvasY - worldY * this.zoom;
  }

  screenToWorld(point: Vec2): Vec2 {
    return {
      x: (point.x - this.x) / this.zoom,
      y: (point.y - this.y) / this.zoom
    };
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, this.x, this.y);
  }

  private clampZoom(value: number): number {
    return Math.max(this.minZoom, Math.min(this.maxZoom, value));
  }
}
