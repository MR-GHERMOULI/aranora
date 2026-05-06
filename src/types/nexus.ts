// ── Nexus Canvas Types ─────────────────────────────────

export type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'parallelogram';

export interface NexusShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;        // fill color
  borderColor: string;  // stroke color
  textColor: string;
  fontSize: number;
  zIndex: number;
  /** Optional priority hint for task generation */
  priority?: 'Low' | 'Medium' | 'High';
  /** Optional label tags */
  labels?: string[];
}

export interface NexusConnection {
  id: string;
  fromShapeId: string;
  toShapeId: string;
  color: string;
  strokeWidth: number;
  label?: string;
  style: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
}

export interface NexusCanvas {
  id: string;
  name: string;
  shapes: NexusShape[];
  connections: NexusConnection[];
  createdAt: string;
  updatedAt: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export type ToolMode =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'hexagon'
  | 'parallelogram'
  | 'connect'
  | 'text';

export interface GeneratedTask {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo';
  order: number;
  dependencies: string[];   // titles of tasks this depends on
  labels: string[];
  estimatedHours: number;
  sourceShapeId: string;
}

/** Color preset for shape palettes */
export interface ColorPreset {
  name: string;
  fill: string;
  border: string;
  text: string;
}

export const SHAPE_COLOR_PRESETS: ColorPreset[] = [
  { name: 'Ocean',      fill: '#1e3a5f', border: '#2e5a8f', text: '#ffffff' },
  { name: 'Emerald',    fill: '#065f46', border: '#059669', text: '#ffffff' },
  { name: 'Violet',     fill: '#5b21b6', border: '#7c3aed', text: '#ffffff' },
  { name: 'Amber',      fill: '#92400e', border: '#d97706', text: '#ffffff' },
  { name: 'Rose',       fill: '#9f1239', border: '#e11d48', text: '#ffffff' },
  { name: 'Cyan',       fill: '#0e7490', border: '#06b6d4', text: '#ffffff' },
  { name: 'Slate',      fill: '#334155', border: '#64748b', text: '#ffffff' },
  { name: 'Soft Blue',  fill: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  { name: 'Soft Green', fill: '#dcfce7', border: '#22c55e', text: '#14532d' },
  { name: 'Soft Rose',  fill: '#ffe4e6', border: '#f43f5e', text: '#881337' },
  { name: 'Soft Amber', fill: '#fef3c7', border: '#f59e0b', text: '#78350f' },
  { name: 'Soft Purple',fill: '#ede9fe', border: '#8b5cf6', text: '#4c1d95' },
];

export const CONNECTION_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#64748b', '#f97316', '#14b8a6',
];
