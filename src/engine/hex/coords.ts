export interface Axial {
  q: number;
  r: number;
}

export interface Point {
  x: number;
  y: number;
}

export function axialToPixel(hex: Axial, size: number): Point {
  return {
    x: size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r),
    y: size * ((3 / 2) * hex.r)
  };
}

export function pixelToAxial(point: Point, size: number): Axial {
  const q = ((Math.sqrt(3) / 3) * point.x - (1 / 3) * point.y) / size;
  const r = ((2 / 3) * point.y) / size;
  return axialRound({ q, r });
}

function axialRound(hex: { q: number; r: number }): Axial {
  let x = hex.q;
  let z = hex.r;
  let y = -x - z;

  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  x = rx;
  z = rz;
  return { q: x, r: z };
}
