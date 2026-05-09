import { v4 as uuidv4 } from 'uuid';
import type {
  NexusShape,
  NexusConnection,
  NexusCanvas as NexusCanvasData,
} from '@/types/nexus';

const STORAGE_KEY = 'aranora-nexus-canvases';

// ── Local Storage Persistence ──────────────────────────

export function loadCanvases(): NexusCanvasData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCanvases(canvases: NexusCanvasData[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases));
}

export function createNewCanvas(name: string): NexusCanvasData {
  return {
    id: uuidv4(),
    name,
    shapes: [],
    connections: [],
    paths: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveCanvas(canvas: NexusCanvasData) {
  const canvases = loadCanvases();
  const index = canvases.findIndex(c => c.id === canvas.id);
  canvas.updatedAt = new Date().toISOString();
  if (index >= 0) {
    canvases[index] = canvas;
  } else {
    canvases.push(canvas);
  }
  saveCanvases(canvases);
}

export function deleteCanvas(canvasId: string) {
  const canvases = loadCanvases().filter(c => c.id !== canvasId);
  saveCanvases(canvases);
}

// ── Shape Helpers ──────────────────────────────────────

export function createShape(
  type: NexusShape['type'],
  x: number,
  y: number,
  color: string = '#1e3a5f',
  borderColor: string = '#2e5a8f',
  textColor: string = '#ffffff',
): NexusShape {
  const sizes: Record<string, { w: number; h: number }> = {
    rectangle: { w: 180, h: 90 },
    circle: { w: 120, h: 120 },
    diamond: { w: 140, h: 140 },
    hexagon: { w: 160, h: 100 },
    parallelogram: { w: 180, h: 90 },
  };
  const size = sizes[type] || sizes.rectangle;

  return {
    id: uuidv4(),
    type,
    x: x - size.w / 2,
    y: y - size.h / 2,
    width: size.w,
    height: size.h,
    text: '',
    color,
    borderColor,
    textColor,
    fontSize: 14,
    zIndex: Date.now(),
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    fontFamily: 'sans',
    direction: 'ltr',
  };
}

export function createConnection(
  fromShapeId: string,
  toShapeId: string,
  color: string = '#3b82f6',
  routing: 'curved' | 'orthogonal' | 'mindmap' = 'curved'
): NexusConnection {
  return {
    id: uuidv4(),
    fromShapeId,
    toShapeId,
    color,
    strokeWidth: 2,
    style: 'solid',
    animated: false,
    routing,
  };
}

// ── Geometry Helpers ───────────────────────────────────

export function getShapeCenter(shape: NexusShape): { x: number; y: number } {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

export function getConnectionPoints(
  from: NexusShape,
  to: NexusShape
): { x1: number; y1: number; x2: number; y2: number } {
  const fc = getShapeCenter(from);
  let tc = getShapeCenter(to);

  if (fc.x === tc.x && fc.y === tc.y) {
    tc = { x: tc.x + 1, y: tc.y + 1 };
  }

  // Snap to edge centers for clean, Miro-like organized splitting
  const fromPoint = getSnapEdgePoint(from, fc, tc);
  const toPoint = getSnapEdgePoint(to, tc, fc);

  return {
    x1: fromPoint.x,
    y1: fromPoint.y,
    x2: toPoint.x,
    y2: toPoint.y,
  };
}

function getSnapEdgePoint(shape: NexusShape, center: {x:number, y:number}, target: {x:number, y:number}) {
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (dx === 0 && dy === 0) return center;

  const w = shape.width;
  const h = shape.height;
  
  // For mindmap nodes, we often want to connect to the left/right edges for a tree-like flow
  if (shape.type === 'mindmap-node') {
    if (dx > 0) return { x: shape.x + shape.width, y: center.y };
    else return { x: shape.x, y: center.y };
  }

  if (Math.abs(dx) * h > Math.abs(dy) * w) {
    // Left or right edge
    if (dx > 0) return { x: shape.x + shape.width, y: center.y };
    else return { x: shape.x, y: center.y };
  } else {
    // Top or bottom edge
    if (dy > 0) return { x: center.x, y: shape.y + shape.height };
    else return { x: center.x, y: shape.y };
  }
}

export function getConnectionPath(
  x1: number, y1: number, x2: number, y2: number, routing: 'curved' | 'orthogonal' | 'mindmap' = 'curved'
): string {
  // Prevent NaN path data
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return '';

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const isHorizontal = dx > dy;
  
  if (routing === 'orthogonal') {
    if (isHorizontal) {
      const cx = (x1 + x2) / 2;
      return `M ${x1} ${y1} L ${cx} ${y1} L ${cx} ${y2} L ${x2} ${y2}`;
    } else {
      const cy = (y1 + y2) / 2;
      return `M ${x1} ${y1} L ${x1} ${cy} L ${x2} ${cy} L ${x2} ${y2}`;
    }
  }

  if (routing === 'mindmap') {
    // Elegant forking curves
    const horizontalOffset = Math.min(dx * 0.45, 100);
    const c1x = x1 + (x2 > x1 ? horizontalOffset : -horizontalOffset);
    const c2x = x2 - (x2 > x1 ? horizontalOffset : -horizontalOffset);
    return `M ${x1} ${y1} C ${c1x} ${y1} ${c2x} ${y2} ${x2} ${y2}`;
  }

  // Miro-style organic cubic bezier paths for distinct splitting
  if (isHorizontal) {
    const offset = Math.max(dx / 2, 40);
    const c1x = x1 + (x2 > x1 ? offset : -offset);
    const c2x = x2 - (x2 > x1 ? offset : -offset);
    return `M ${x1} ${y1} C ${c1x} ${y1} ${c2x} ${y2} ${x2} ${y2}`;
  } else {
    const offset = Math.max(dy / 2, 40);
    const c1y = y1 + (y2 > y1 ? offset : -offset);
    const c2y = y2 - (y2 > y1 ? offset : -offset);
    return `M ${x1} ${y1} C ${x1} ${c1y} ${x2} ${c2y} ${x2} ${y2}`;
  }
}

function getEdgePoint(
  shape: NexusShape,
  center: { x: number; y: number },
  target: { x: number; y: number }
): { x: number; y: number } {
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (dx === 0 && dy === 0) return center;

  const hw = shape.width / 2;
  const hh = shape.height / 2;

  if (shape.type === 'circle') {
    const r = Math.max(hw, hh);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return {
      x: center.x + (dx / dist) * r,
      y: center.y + (dy / dist) * r,
    };
  }

  // Rectangle/default: find intersection with boundary
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let scale: number;
  if (absDx / hw > absDy / hh) {
    scale = hw / absDx;
  } else {
    scale = hh / absDy;
  }

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

export function isPointInShape(
  px: number,
  py: number,
  shape: NexusShape,
  padding: number = 0
): boolean {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  if (shape.type === 'circle') {
    const r = Math.max(shape.width, shape.height) / 2 + padding;
    return (px - cx) ** 2 + (py - cy) ** 2 <= r ** 2;
  }

  if (shape.type === 'diamond') {
    // Diamond = rotated rectangle check
    const hw = shape.width / 2 + padding;
    const hh = shape.height / 2 + padding;
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    return (dx / hw + dy / hh) <= 1;
  }

  // Rectangle-like shapes
  return (
    px >= shape.x - padding &&
    px <= shape.x + shape.width + padding &&
    py >= shape.y - padding &&
    py <= shape.y + shape.height + padding
  );
}
