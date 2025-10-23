import * as FigmaTypes from '@figma/rest-api-spec';

/**
 * Determine if a VECTOR node is a rectangle-like shape, including rounded corners.
 * Heuristic, tolerant detection that accepts:
 * - Closed single-subpath shapes
 * - Straight segments confined to two perpendicular directions (rectangle axes)
 * - Optional curved segments at corners (A/C/Q/S/T) that simply round the corners
 */
export function figmaNodeRectLikeVector(node?: FigmaTypes.Node): boolean {
  if (!node || node.type !== 'VECTOR') return false;

  type GeometryLike = { path?: string; data?: string };
  type GeometryContainer = {
    fillGeometry?: GeometryLike[];
    vectorPaths?: GeometryLike[];
    strokeGeometry?: GeometryLike[];
  };

  const gnode = node as unknown as GeometryContainer;
  const sources: (GeometryLike[] | undefined)[] = [
    gnode.fillGeometry,
    gnode.vectorPaths,
    gnode.strokeGeometry,
  ];

  // Try any available geometry array
  for (const arr of sources) {
    if (!Array.isArray(arr) || arr.length === 0) continue;

    for (const g of arr) {
      const path: string | undefined =
        g?.path || (g && (g as { data?: string }).data);
      if (!path || typeof path !== 'string') continue;

      const parsed = parseSvgPathToSegments(path);
      if (!parsed) continue;

      // infer closed if last endpoint equals first start
      let closed = parsed.closed;
      if (!closed && parsed.segments.length > 1) {
        const firstFrom = parsed.segments[0].from;
        const lastTo = parsed.segments[parsed.segments.length - 1].to;
        closed = pointsEqual(firstFrom, lastTo);
      }
      if (!closed) continue;

      // Consider only straight segments for direction analysis
      const lineSegs = parsed.segments.filter((s) => s.type === 'line');
      if (lineSegs.length < 2) continue; // tolerate curves dominating, but need some straightness

      // Use the longest straight segment to define the first axis
      const longest = lineSegs.reduce((a, b) =>
        segLen(b) > segLen(a) ? b : a,
      );
      const axisA = norm(vec(longest.from, longest.to));
      if (vlen(axisA) === 0) continue;

      const groupA: typeof lineSegs = [];
      const groupB: typeof lineSegs = [];

      let badDir = false;
      for (const s of lineSegs) {
        const d = norm(vec(s.from, s.to));
        if (vlen(d) === 0) continue;
        const par = isParallel(d, axisA);
        const ortho = isOrthogonal(d, axisA);
        if (par) groupA.push(s);
        else if (ortho) groupB.push(s);
        else {
          badDir = true; // direction not aligned to the two rectangle axes
          break;
        }
      }
      if (badDir) continue;

      if (groupA.length === 0 || groupB.length === 0) continue;

      // Validate axes are perpendicular using group medians
      const axisB = dominantDirection(groupB);
      if (!axisB) continue;
      if (!isOrthogonal(axisA, axisB)) continue;

      // Basic convexity check on the sequence of straight segments (ignoring curves)
      const straightDirs = compactDirectionsInOrder(parsed.segments);
      if (straightDirs.length < 2) continue;
      const turnSign = Math.sign(
        straightDirs.reduce((acc, cur, i) => {
          const next = straightDirs[(i + 1) % straightDirs.length];
          return acc + cross(cur, next);
        }, 0),
      );
      if (turnSign === 0) continue; // degenerate
      // Ensure all consecutive turns are roughly same sign
      let consistentTurns = true;
      for (let i = 0; i < straightDirs.length; i++) {
        const a = straightDirs[i];
        const b = straightDirs[(i + 1) % straightDirs.length];
        if (Math.sign(cross(a, b)) !== turnSign) {
          consistentTurns = false;
          break;
        }
      }
      if (!consistentTurns) continue;

      return true; // Found a rectangle-like subpath
    }
  }

  // Fallback: some VECTORs may carry rectangle hints even when geometry arrays are empty
  const nodeAny = node as unknown as {
    cornerRadius?: number;
    rectangleCornerRadii?: number[];
    size?: { x?: number; y?: number };
  };
  const anyCornerRadius =
    typeof nodeAny.cornerRadius === 'number' ||
    (Array.isArray(nodeAny.rectangleCornerRadii) &&
      nodeAny.rectangleCornerRadii.length === 4);
  const hasSize = (nodeAny.size?.x || 0) > 0 && (nodeAny.size?.y || 0) > 0;
  if (anyCornerRadius && hasSize) return true;

  return false;
}

/** SVG segments parsed from a path */
type SvgSegment = {
  type: 'line' | 'curve';
  from: [number, number];
  to: [number, number];
};

/** Parse SVG path (supports M/L/H/V/C/S/Q/T/A/Z) to absolute segments */
function parseSvgPathToSegments(
  path: string,
): { segments: SvgSegment[]; closed: boolean } | undefined {
  const regex = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(path)) !== null) tokens.push(m[0]);
  if (tokens.length === 0) return undefined;

  let i = 0;
  let cmd = '';
  let x = 0,
    y = 0;
  let sx = 0,
    sy = 0; // subpath start
  let closed = false;
  const segs: SvgSegment[] = [];

  const readNum = (): number | undefined => {
    if (i >= tokens.length) return undefined;
    const v = Number(tokens[i++]);
    return Number.isFinite(v) ? v : undefined;
  };

  const lineTo = (nx: number, ny: number) => {
    const from: [number, number] = [x, y];
    const to: [number, number] = [nx, ny];
    if (!pointsEqual(from, to)) segs.push({ type: 'line', from, to });
    x = nx;
    y = ny;
  };

  const curveTo = (nx: number, ny: number) => {
    const from: [number, number] = [x, y];
    const to: [number, number] = [nx, ny];
    if (!pointsEqual(from, to)) segs.push({ type: 'curve', from, to });
    x = nx;
    y = ny;
  };

  while (i < tokens.length) {
    const t = tokens[i++];
    if (/^[MmLlHhVvCcSsQqTtAaZz]$/.test(t)) {
      cmd = t;
    } else {
      i--;
    }

    switch (cmd) {
      case 'M': {
        const nx = readNum();
        const ny = readNum();
        if (nx === undefined || ny === undefined) return undefined;
        x = sx = nx;
        y = sy = ny;
        // Subsequent pairs are treated as line-tos
        while (true) {
          const n2x = readNum();
          const n2y = readNum();
          if (n2x === undefined || n2y === undefined) break;
          lineTo(n2x, n2y);
        }
        break;
      }
      case 'm': {
        const dx = readNum();
        const dy = readNum();
        if (dx === undefined || dy === undefined) return undefined;
        x = sx = x + dx;
        y = sy = y + dy;
        while (true) {
          const ddx = readNum();
          const ddy = readNum();
          if (ddx === undefined || ddy === undefined) break;
          lineTo(x + ddx, y + ddy);
        }
        break;
      }
      case 'L': {
        let nx: number | undefined, ny: number | undefined;
        while (
          (nx = readNum()) !== undefined &&
          (ny = readNum()) !== undefined
        ) {
          lineTo(nx, ny);
        }
        break;
      }
      case 'l': {
        let dx: number | undefined, dy: number | undefined;
        while (
          (dx = readNum()) !== undefined &&
          (dy = readNum()) !== undefined
        ) {
          lineTo(x + dx, y + dy);
        }
        break;
      }
      case 'H': {
        let nx: number | undefined;
        while ((nx = readNum()) !== undefined) lineTo(nx, y);
        break;
      }
      case 'h': {
        let dx: number | undefined;
        while ((dx = readNum()) !== undefined) lineTo(x + dx, y);
        break;
      }
      case 'V': {
        let ny: number | undefined;
        while ((ny = readNum()) !== undefined) lineTo(x, ny);
        break;
      }
      case 'v': {
        let dy: number | undefined;
        while ((dy = readNum()) !== undefined) lineTo(x, y + dy);
        break;
      }
      // Cubic Bezier: (x1 y1 x2 y2 x y)+ — we only care about end point
      case 'C': {
        while (true) {
          const x1 = readNum();
          const y1 = readNum();
          const x2 = readNum();
          const y2 = readNum();
          const nx = readNum();
          const ny = readNum();
          if (
            x1 === undefined ||
            y1 === undefined ||
            x2 === undefined ||
            y2 === undefined ||
            nx === undefined ||
            ny === undefined
          )
            break;
          curveTo(nx, ny);
        }
        break;
      }
      case 'c': {
        while (true) {
          const x1 = readNum();
          const y1 = readNum();
          const x2 = readNum();
          const y2 = readNum();
          const dx = readNum();
          const dy = readNum();
          if (
            x1 === undefined ||
            y1 === undefined ||
            x2 === undefined ||
            y2 === undefined ||
            dx === undefined ||
            dy === undefined
          )
            break;
          curveTo(x + dx, y + dy);
        }
        break;
      }
      // Smooth cubic: (x2 y2 x y)+
      case 'S': {
        while (true) {
          const x2 = readNum();
          const y2 = readNum();
          const nx = readNum();
          const ny = readNum();
          if (
            x2 === undefined ||
            y2 === undefined ||
            nx === undefined ||
            ny === undefined
          )
            break;
          curveTo(nx, ny);
        }
        break;
      }
      case 's': {
        while (true) {
          const x2 = readNum();
          const y2 = readNum();
          const dx = readNum();
          const dy = readNum();
          if (
            x2 === undefined ||
            y2 === undefined ||
            dx === undefined ||
            dy === undefined
          )
            break;
          curveTo(x + dx, y + dy);
        }
        break;
      }
      // Quadratic: (x1 y1 x y)+
      case 'Q': {
        while (true) {
          const x1 = readNum();
          const y1 = readNum();
          const nx = readNum();
          const ny = readNum();
          if (
            x1 === undefined ||
            y1 === undefined ||
            nx === undefined ||
            ny === undefined
          )
            break;
          curveTo(nx, ny);
        }
        break;
      }
      case 'q': {
        while (true) {
          const x1 = readNum();
          const y1 = readNum();
          const dx = readNum();
          const dy = readNum();
          if (
            x1 === undefined ||
            y1 === undefined ||
            dx === undefined ||
            dy === undefined
          )
            break;
          curveTo(x + dx, y + dy);
        }
        break;
      }
      // Smooth quadratic: (x y)+
      case 'T': {
        let nx: number | undefined, ny: number | undefined;
        while (
          (nx = readNum()) !== undefined &&
          (ny = readNum()) !== undefined
        ) {
          curveTo(nx, ny);
        }
        break;
      }
      case 't': {
        let dx: number | undefined, dy: number | undefined;
        while (
          (dx = readNum()) !== undefined &&
          (dy = readNum()) !== undefined
        ) {
          curveTo(x + dx, y + dy);
        }
        break;
      }
      // Arc: (rx ry xrot large-arc-flag sweep-flag x y)+
      case 'A': {
        while (true) {
          const rx = readNum();
          const ry = readNum();
          const xrot = readNum();
          const laf = readNum();
          const sf = readNum();
          const nx = readNum();
          const ny = readNum();
          if (
            rx === undefined ||
            ry === undefined ||
            xrot === undefined ||
            laf === undefined ||
            sf === undefined ||
            nx === undefined ||
            ny === undefined
          )
            break;
          curveTo(nx, ny);
        }
        break;
      }
      case 'a': {
        while (true) {
          const rx = readNum();
          const ry = readNum();
          const xrot = readNum();
          const laf = readNum();
          const sf = readNum();
          const dx = readNum();
          const dy = readNum();
          if (
            rx === undefined ||
            ry === undefined ||
            xrot === undefined ||
            laf === undefined ||
            sf === undefined ||
            dx === undefined ||
            dy === undefined
          )
            break;
          curveTo(x + dx, y + dy);
        }
        break;
      }
      case 'Z':
      case 'z': {
        closed = true;
        // Close path by a straight segment if needed
        if (!pointsEqual([x, y], [sx, sy])) {
          lineTo(sx, sy);
        }
        break;
      }
      default:
        return undefined;
    }
  }

  // If path did not explicitly close, consider closed if last endpoint equals start
  if (!closed && segs.length > 1) {
    const firstFrom = segs[0].from;
    const lastTo = segs[segs.length - 1].to;
    closed = pointsEqual(firstFrom, lastTo);
  }

  return { segments: segs, closed };
}

/** Collapse consecutive co-linear line directions from the parsed sequence */
function compactDirectionsInOrder(
  segments: SvgSegment[],
): Array<[number, number]> {
  const dirs: Array<[number, number]> = [];
  for (const s of segments) {
    if (s.type !== 'line') continue;
    const d = norm(vec(s.from, s.to));
    if (vlen(d) === 0) continue;
    if (dirs.length === 0) {
      dirs.push(d);
    } else {
      const last = dirs[dirs.length - 1];
      // If current direction is parallel to last, skip (same side piece)
      if (isParallel(last, d)) continue;
      dirs.push(d);
    }
  }
  return dirs;
}

function dominantDirection(segs: SvgSegment[]): [number, number] | undefined {
  if (segs.length === 0) return undefined;
  // pick by longest combined projection
  let best: [number, number] | undefined;
  let bestScore = -Infinity;
  for (const s of segs) {
    const d = norm(vec(s.from, s.to));
    if (vlen(d) === 0) continue;
    const score = segs.reduce(
      (acc, t) => acc + Math.abs(dot(norm(vec(t.from, t.to)), d)),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

function pointsEqual(
  a: [number, number],
  b: [number, number],
  eps = 1e-3,
): boolean {
  return Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
}

function vec(a: [number, number], b: [number, number]): [number, number] {
  return [b[0] - a[0], b[1] - a[1]];
}

function norm(v: [number, number]): [number, number] {
  const L = vlen(v);
  if (L === 0) return [0, 0];
  return [v[0] / L, v[1] / L];
}

function vlen(v: [number, number]): number {
  return Math.hypot(v[0], v[1]);
}

function dot(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function cross(a: [number, number], b: [number, number]): number {
  return a[0] * b[1] - a[1] * b[0];
}

// length of a segment
function segLen(s: SvgSegment): number {
  return vlen(vec(s.from, s.to));
}

function isOrthogonal(
  a: [number, number],
  b: [number, number],
  eps = 1e-3,
): boolean {
  // dot close to 0 relative to the product of lengths
  const denom = vlen(a) * vlen(b) || 1;
  return Math.abs(dot(a, b)) <= eps * denom;
}

function isParallel(
  a: [number, number],
  b: [number, number],
  eps = 1e-3,
): boolean {
  // cross close to 0 relative to the product of lengths
  const denom = vlen(a) * vlen(b) || 1;
  return Math.abs(cross(a, b)) <= eps * denom;
}
