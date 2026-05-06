'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  NexusShape, NexusConnection, ToolMode, GeneratedTask,
  CanvasViewport, NexusCanvas as NexusCanvasData,
} from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import { cn } from '@/lib/utils';
import {
  createShape, createConnection, getConnectionPoints,
  isPointInShape, saveCanvas, loadCanvases, createNewCanvas, deleteCanvas as deleteCanvasStorage,
} from '@/lib/nexus/canvas-helpers';
import { convertCanvasToTasks } from '@/lib/nexus/converter';
import { NexusToolbar } from './nexus-toolbar';
import { ShapeRenderer } from './shape-renderer';
import { TaskPanel } from './task-panel';
import { CanvasList } from './canvas-list';
import { createTask as pushTask } from '@/app/(dashboard)/tasks/actions';
import { toast } from 'sonner';
import { Sparkles, MousePointer2, Zap } from 'lucide-react';

interface NexusCanvasProps {
  projects: { id: string; title: string }[];
  userId: string;
}

export function NexusCanvas({ projects, userId }: NexusCanvasProps) {
  // ── Canvas State ─────────────────────────────────────
  const [shapes, setShapes] = useState<NexusShape[]>([]);
  const [connections, setConnections] = useState<NexusConnection[]>([]);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [canvasId, setCanvasId] = useState<string>('');

  // ── Tool State ───────────────────────────────────────
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [activeColor, setActiveColor] = useState(SHAPE_COLOR_PRESETS[0]);
  const [connectionColor, setConnectionColor] = useState('#3b82f6');

  // ── Viewport ─────────────────────────────────────────
  const [viewport, setViewport] = useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Interaction State ────────────────────────────────
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ shapeId: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; startVpX: number; startVpY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // ── Panel State ──────────────────────────────────────
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[] | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showCanvasList, setShowCanvasList] = useState(false);

  // ── Screen-to-Canvas coordinate conversion ──────────
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // ── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingShapeId) return;
      const key = e.key.toLowerCase();
      if (key === 'v') setActiveTool('select');
      else if (key === 'h') setActiveTool('pan');
      else if (key === 'r') setActiveTool('rectangle');
      else if (key === 'c') setActiveTool('circle');
      else if (key === 'd') setActiveTool('diamond');
      else if (key === 'x') setActiveTool('hexagon');
      else if (key === 'l') setActiveTool('connect');
      else if (key === 'delete' || key === 'backspace') {
        if (selectedShapeId) {
          setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
          setConnections(prev => prev.filter(c => c.fromShapeId !== selectedShapeId && c.toShapeId !== selectedShapeId));
          setSelectedShapeId(null);
        }
      } else if (key === 'escape') {
        setSelectedShapeId(null);
        setEditingShapeId(null);
        setConnectFrom(null);
        setTempLine(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingShapeId, selectedShapeId]);

  // ── Wheel zoom ──────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(3, Math.max(0.15, viewport.zoom * zoomFactor));

      setViewport(prev => ({
        zoom: newZoom,
        x: mx - ((mx - prev.x) / prev.zoom) * newZoom,
        y: my - ((my - prev.y) / prev.zoom) * newZoom,
      }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [viewport.zoom]);

  // ── Mouse handlers ──────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    const shapeTools = ['rectangle', 'circle', 'diamond', 'hexagon', 'parallelogram'] as const;

    if (shapeTools.includes(activeTool as any)) {
      const newShape = createShape(
        activeTool as NexusShape['type'], x, y,
        activeColor.fill, activeColor.border, activeColor.text
      );
      setShapes(prev => [...prev, newShape]);
      setSelectedShapeId(newShape.id);
      setEditingShapeId(newShape.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'pan') {
      setPanning({ startX: e.clientX, startY: e.clientY, startVpX: viewport.x, startVpY: viewport.y });
      return;
    }

    // Click on empty space in select mode
    if (activeTool === 'select') {
      setSelectedShapeId(null);
      setEditingShapeId(null);
    }
  };

  const handleShapeMouseDown = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    if (activeTool === 'connect') {
      if (!connectFrom) {
        setConnectFrom(shapeId);
      } else if (connectFrom !== shapeId) {
        const exists = connections.find(
          c => (c.fromShapeId === connectFrom && c.toShapeId === shapeId) ||
               (c.fromShapeId === shapeId && c.toShapeId === connectFrom)
        );
        if (!exists) {
          setConnections(prev => [...prev, createConnection(connectFrom, shapeId, connectionColor)]);
        }
        setConnectFrom(null);
        setTempLine(null);
      }
      return;
    }

    setSelectedShapeId(shapeId);
    setEditingShapeId(null);
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, zIndex: Date.now() } : s));
    setDragging({ shapeId, offsetX: x - shape.x, offsetY: y - shape.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panning) {
      setViewport(prev => ({
        ...prev,
        x: panning.startVpX + (e.clientX - panning.startX),
        y: panning.startVpY + (e.clientY - panning.startY),
      }));
      return;
    }

    if (dragging) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setShapes(prev => prev.map(s =>
        s.id === dragging.shapeId ? { ...s, x: x - dragging.offsetX, y: y - dragging.offsetY } : s
      ));
      return;
    }

    if (connectFrom) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const fromShape = shapes.find(s => s.id === connectFrom);
      if (fromShape) {
        const cx = fromShape.x + fromShape.width / 2;
        const cy = fromShape.y + fromShape.height / 2;
        setTempLine({ x1: cx, y1: cy, x2: x, y2: y });
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setPanning(null);
  };

  const handleDoubleClick = (shapeId: string) => {
    setEditingShapeId(shapeId);
    setSelectedShapeId(shapeId);
  };

  const handleTextChange = (shapeId: string, text: string) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, text } : s));
  };

  // ── Convert to Tasks ────────────────────────────────
  const handleConvert = async () => {
    setIsConverting(true);
    await new Promise(r => setTimeout(r, 800));
    const tasks = convertCanvasToTasks(shapes, connections);
    setGeneratedTasks(tasks);
    setIsConverting(false);
  };

  // ── Push tasks to workspace ─────────────────────────
  const handlePushToTasks = async (tasks: GeneratedTask[], projectId: string | null) => {
    setIsPushing(true);
    try {
      let successCount = 0;
      for (const task of tasks) {
        const fd = new FormData();
        fd.set('title', task.title);
        fd.set('description', task.description);
        fd.set('priority', task.priority);
        fd.set('status', 'Todo');
        fd.set('labels', JSON.stringify(task.labels));
        fd.set('estimated_hours', String(task.estimatedHours));
        if (projectId) fd.set('project_id', projectId);

        const result = await pushTask(fd);
        if (result?.success) successCount++;
      }
      toast.success(`Successfully created ${successCount} task${successCount !== 1 ? 's' : ''}!`);
      setGeneratedTasks(null);
    } catch (err) {
      toast.error('Failed to create some tasks. Please try again.');
    } finally {
      setIsPushing(false);
    }
  };

  // ── Save / Load ─────────────────────────────────────
  const handleSave = () => {
    const canvas: NexusCanvasData = {
      id: canvasId || crypto.randomUUID(),
      name: canvasName,
      shapes,
      connections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!canvasId) setCanvasId(canvas.id);
    saveCanvas(canvas);
    toast.success('Canvas saved!');
  };

  const handleLoadCanvas = (canvas: NexusCanvasData) => {
    setShapes(canvas.shapes);
    setConnections(canvas.connections);
    setCanvasName(canvas.name);
    setCanvasId(canvas.id);
    setShowCanvasList(false);
    setSelectedShapeId(null);
    setEditingShapeId(null);
    toast.success(`Loaded "${canvas.name}"`);
  };

  const handleNewCanvas = () => {
    setShapes([]);
    setConnections([]);
    setCanvasName('Untitled Canvas');
    setCanvasId('');
    setSelectedShapeId(null);
    setEditingShapeId(null);
    setGeneratedTasks(null);
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const handleClear = () => {
    if (shapes.length === 0) return;
    setShapes([]);
    setConnections([]);
    setSelectedShapeId(null);
    setEditingShapeId(null);
    toast.info('Canvas cleared');
  };

  // ── Render connections ──────────────────────────────
  const renderConnections = () => {
    return connections.map(conn => {
      const from = shapes.find(s => s.id === conn.fromShapeId);
      const to = shapes.find(s => s.id === conn.toShapeId);
      if (!from || !to) return null;
      const pts = getConnectionPoints(from, to);
      const angle = Math.atan2(pts.y2 - pts.y1, pts.x2 - pts.x1) * (180 / Math.PI);
      const dashArray = conn.style === 'dashed' ? '8 4' : conn.style === 'dotted' ? '3 3' : 'none';

      return (
        <g key={conn.id}>
          <defs>
            <marker
              id={`arrow-${conn.id}`}
              markerWidth="10" markerHeight="8"
              refX="9" refY="4" orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 4 L 0 8 z" fill={conn.color} />
            </marker>
          </defs>
          <line
            x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
            stroke={conn.color}
            strokeWidth={conn.strokeWidth}
            strokeDasharray={dashArray}
            markerEnd={`url(#arrow-${conn.id})`}
            className="transition-all"
          />
          {conn.label && (
            <text
              x={(pts.x1 + pts.x2) / 2}
              y={(pts.y1 + pts.y2) / 2 - 8}
              textAnchor="middle"
              fill={conn.color}
              fontSize="11"
              fontFamily="Inter, system-ui, sans-serif"
              className="select-none"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    });
  };

  // ── Render grid pattern ─────────────────────────────
  const gridSize = 30;

  return (
    <div className="h-screen w-full overflow-hidden relative bg-[#0a0e1a]" style={{ marginLeft: '0' }}>
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-600/[0.04] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-emerald-600/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Toolbar */}
      <NexusToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        activeColor={activeColor}
        onColorChange={(fill, border, text) => setActiveColor({ fill, border, text, name: '' })}
        connectionColor={connectionColor}
        onConnectionColorChange={setConnectionColor}
        onConvert={handleConvert}
        onSave={handleSave}
        onClear={handleClear}
        onNewCanvas={handleNewCanvas}
        onLoadCanvas={() => setShowCanvasList(true)}
        canvasName={canvasName}
        onCanvasNameChange={setCanvasName}
        shapeCount={shapes.length}
        connectionCount={connections.length}
        isConverting={isConverting}
      />

      {/* Mini-map / zoom indicator */}
      <div className="absolute bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur border border-white/10 text-zinc-400 text-xs">
        <button onClick={() => setViewport(v => ({ ...v, zoom: Math.min(3, v.zoom * 1.2) }))} className="hover:text-white transition">+</button>
        <span className="w-12 text-center font-mono">{Math.round(viewport.zoom * 100)}%</span>
        <button onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.15, v.zoom / 1.2) }))} className="hover:text-white transition">−</button>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
          className="hover:text-white transition text-[10px]"
        >
          Reset
        </button>
      </div>

      {/* Canvas Context Hint */}
      {shapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-4 animate-pulse">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/5 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-violet-500/40" />
            </div>
            <div>
              <h3 className="text-zinc-500 text-lg font-medium">Start Your Nexus</h3>
              <p className="text-zinc-600 text-sm mt-1 max-w-xs mx-auto">
                Select a shape tool from the toolbar above, then click anywhere on the canvas to begin brainstorming
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-600">
              <span className="flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> Click to place</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Double-click to edit</span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair"
        style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
            {/* Grid */}
            <defs>
              <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                <circle cx={gridSize / 2} cy={gridSize / 2} r="0.8" fill="rgba(255,255,255,0.04)" />
              </pattern>
            </defs>
            <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#grid)" />

            {/* Connections */}
            {renderConnections()}

            {/* Temp connection line */}
            {tempLine && (
              <line
                x1={tempLine.x1} y1={tempLine.y1}
                x2={tempLine.x2} y2={tempLine.y2}
                stroke={connectionColor}
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.6}
              />
            )}

            {/* Shapes */}
            {[...shapes].sort((a, b) => a.zIndex - b.zIndex).map(shape => (
              <ShapeRenderer
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeId === shape.id}
                isConnectSource={connectFrom === shape.id}
                zoom={viewport.zoom}
                onMouseDown={handleShapeMouseDown}
                onDoubleClick={handleDoubleClick}
                onTextChange={handleTextChange}
                editingShapeId={editingShapeId}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Generated Tasks Panel */}
      {generatedTasks && (
        <TaskPanel
          tasks={generatedTasks}
          onClose={() => setGeneratedTasks(null)}
          onPushToTasks={handlePushToTasks}
          projects={projects}
          isPushing={isPushing}
        />
      )}

      {/* Canvas List Dialog */}
      {showCanvasList && (
        <CanvasList
          canvases={loadCanvases()}
          onSelect={handleLoadCanvas}
          onDelete={(id) => { deleteCanvasStorage(id); setShowCanvasList(true); }}
          onClose={() => setShowCanvasList(false)}
        />
      )}
    </div>
  );
}
