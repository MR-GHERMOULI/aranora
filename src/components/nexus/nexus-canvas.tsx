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
  saveCanvas, loadCanvases, deleteCanvas as deleteCanvasStorage,
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
  const [shapes, setShapes] = useState<NexusShape[]>([]);
  const [connections, setConnections] = useState<NexusConnection[]>([]);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [canvasId, setCanvasId] = useState<string>('');

  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [activeColor, setActiveColor] = useState(SHAPE_COLOR_PRESETS[0]);
  const [connectionColor, setConnectionColor] = useState('#3b82f6');

  const [viewport, setViewport] = useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ shapeId: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; startVpX: number; startVpY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[] | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showCanvasList, setShowCanvasList] = useState(false);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // ── Escape / keyboard shortcuts ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingShapeId && e.key !== 'Escape') return;
      const key = e.key.toLowerCase();

      if (e.key === 'Escape') {
        // Always cancel any pending action and return to select
        setConnectFrom(null);
        setTempLine(null);
        setSelectedShapeId(null);
        setSelectedConnId(null);
        setEditingShapeId(null);
        setEditingConnId(null);
        setActiveTool('select');
        return;
      }
      if (key === 'v') setActiveTool('select');
      else if (key === 'h') setActiveTool('pan');
      else if (key === 'r') setActiveTool('rectangle');
      else if (key === 'c') setActiveTool('circle');
      else if (key === 'd') setActiveTool('diamond');
      else if (key === 'x') setActiveTool('hexagon');
      else if (key === 'l') setActiveTool('connect');
      else if (key === 'delete' || key === 'backspace') {
        if (selectedConnId) {
          setConnections(prev => prev.filter(c => c.id !== selectedConnId));
          setSelectedConnId(null);
        } else if (selectedShapeId) {
          setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
          setConnections(prev => prev.filter(c => c.fromShapeId !== selectedShapeId && c.toShapeId !== selectedShapeId));
          setSelectedShapeId(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingShapeId, selectedShapeId, selectedConnId]);

  // ── Wheel zoom ───────────────────────────────────────
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

  // ── Canvas click ─────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const shapeTools = ['rectangle', 'circle', 'diamond', 'hexagon', 'parallelogram'] as const;

    if (shapeTools.includes(activeTool as any)) {
      const newShape = createShape(activeTool as NexusShape['type'], x, y, activeColor.fill, activeColor.border, activeColor.text);
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
    if (activeTool === 'connect') {
      // Clicking empty canvas cancels connect
      setConnectFrom(null);
      setTempLine(null);
      return;
    }
    setSelectedShapeId(null);
    setSelectedConnId(null);
    setEditingShapeId(null);
    setEditingConnId(null);
  };

  // ── Shape click ──────────────────────────────────────
  const handleShapeMouseDown = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    if (activeTool === 'connect') {
      if (!connectFrom) {
        setConnectFrom(shapeId);
        // Start tempLine from shape center
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        setTempLine({ x1: cx, y1: cy, x2: cx, y2: cy });
      } else if (connectFrom !== shapeId) {
        const exists = connections.find(
          c => (c.fromShapeId === connectFrom && c.toShapeId === shapeId)
        );
        if (!exists) {
          setConnections(prev => [...prev, createConnection(connectFrom, shapeId, connectionColor)]);
        }
        setConnectFrom(null);
        setTempLine(null);
      } else {
        // Clicked same shape: cancel
        setConnectFrom(null);
        setTempLine(null);
      }
      return;
    }

    setSelectedShapeId(shapeId);
    setSelectedConnId(null);
    setEditingShapeId(null);
    setEditingConnId(null);
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, zIndex: Date.now() } : s));
    setDragging({ shapeId, offsetX: x - shape.x, offsetY: y - shape.y });
  };

  const handleConnClick = (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    setSelectedConnId(connId);
    setSelectedShapeId(null);
    setEditingConnId(null);
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
        setTempLine({ x1: fromShape.x + fromShape.width / 2, y1: fromShape.y + fromShape.height / 2, x2: x, y2: y });
      }
    }
  };

  const handleMouseUp = () => { setDragging(null); setPanning(null); };
  const handleDoubleClick = (shapeId: string) => { 
    setEditingShapeId(shapeId); 
    setEditingConnId(null);
    setSelectedShapeId(shapeId); 
  };
  
  const handleConnDoubleClick = (connId: string) => {
    setEditingConnId(connId);
    setEditingShapeId(null);
    setSelectedConnId(connId);
  };

  const handleTextChange = (shapeId: string, text: string) => setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, text } : s));

  // ── Convert ──────────────────────────────────────────
  const handleConvert = async () => {
    setIsConverting(true);
    await new Promise(r => setTimeout(r, 800));
    setGeneratedTasks(convertCanvasToTasks(shapes, connections));
    setIsConverting(false);
  };

  const handlePushToTasks = async (tasks: GeneratedTask[], projectId: string | null) => {
    setIsPushing(true);
    try {
      let count = 0;
      for (const task of tasks) {
        const fd = new FormData();
        fd.set('title', task.title);
        fd.set('description', task.description);
        fd.set('priority', task.priority);
        fd.set('status', 'Todo');
        fd.set('labels', JSON.stringify(task.labels));
        fd.set('estimated_hours', String(task.estimatedHours));
        if (projectId) fd.set('project_id', projectId);
        const r = await pushTask(fd);
        if (r?.success) count++;
      }
      toast.success(`Created ${count} task${count !== 1 ? 's' : ''}!`);
      setGeneratedTasks(null);
    } catch { toast.error('Failed to create some tasks.'); }
    finally { setIsPushing(false); }
  };

  const handleSave = () => {
    const canvas: NexusCanvasData = { id: canvasId || crypto.randomUUID(), name: canvasName, shapes, connections, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!canvasId) setCanvasId(canvas.id);
    saveCanvas(canvas);
    toast.success('Canvas saved!');
  };

  const handleLoadCanvas = (canvas: NexusCanvasData) => {
    setShapes(canvas.shapes); setConnections(canvas.connections);
    setCanvasName(canvas.name); setCanvasId(canvas.id);
    setShowCanvasList(false); setSelectedShapeId(null); setEditingShapeId(null);
    toast.success(`Loaded "${canvas.name}"`);
  };

  const handleNewCanvas = () => {
    setShapes([]); setConnections([]); setCanvasName('Untitled Canvas');
    setCanvasId(''); setSelectedShapeId(null); setEditingShapeId(null);
    setGeneratedTasks(null); setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const handleClear = () => {
    if (shapes.length === 0) return;
    setShapes([]); setConnections([]);
    setSelectedShapeId(null); setEditingShapeId(null);
    toast.info('Canvas cleared');
  };

  // ── Render connections ───────────────────────────────
  const renderConnections = () => {
    return connections.map(conn => {
      const from = shapes.find(s => s.id === conn.fromShapeId);
      const to = shapes.find(s => s.id === conn.toShapeId);
      if (!from || !to) return null;
      const pts = getConnectionPoints(from, to);
      const midX = (pts.x1 + pts.x2) / 2;
      const midY = (pts.y1 + pts.y2) / 2;
      const isSelected = selectedConnId === conn.id;
      const isEditing = editingConnId === conn.id;
      const dashArray = conn.style === 'dashed' ? '8 4' : conn.style === 'dotted' ? '3 3' : 'none';

      return (
        <g 
          key={conn.id}
          onDoubleClick={(e) => { e.stopPropagation(); handleConnDoubleClick(conn.id); }}
        >
          {/* Invisible wide hit area for click */}
          <line
            x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
            stroke="transparent" strokeWidth={20}
            style={{ cursor: 'pointer' }}
            onClick={e => handleConnClick(e, conn.id)}
          />
          
          {/* Selection Glow */}
          {isSelected && (
            <line
              x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
              stroke="#3b82f6" strokeWidth={conn.strokeWidth + 6}
              strokeOpacity={0.2}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Visible line: dot start, arrow end */}
          <line
            x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
            stroke={isSelected ? '#3b82f6' : conn.color}
            strokeWidth={isSelected ? conn.strokeWidth + 1 : conn.strokeWidth}
            strokeDasharray={dashArray}
            markerStart={`url(#dot-${conn.id})`}
            markerEnd={`url(#arrow-${conn.id})`}
            style={{ pointerEvents: 'none' }}
            className="transition-colors duration-200"
          />

          {/* Label pill in the middle */}
          {(conn.label || isEditing) && (
            <foreignObject
              x={midX - 60}
              y={midY - 15}
              width={120}
              height={30}
              style={{ pointerEvents: isEditing ? 'all' : 'none' }}
            >
              <div className="flex items-center justify-center h-full">
                {isEditing ? (
                  <input
                    autoFocus
                    value={conn.label || ''}
                    onChange={(e) => setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, label: e.target.value } : c))}
                    onBlur={() => setEditingConnId(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingConnId(null); }}
                    className="w-28 px-2 py-0.5 bg-white border-2 border-blue-500 rounded-lg text-[10px] font-bold text-center shadow-xl outline-none"
                    placeholder="Label..."
                  />
                ) : (
                  <div className={cn(
                    "px-3 py-1 bg-white border rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap transition-all",
                    isSelected ? "border-blue-500 text-blue-600 scale-105" : "border-gray-200 text-gray-700"
                  )}>
                    {conn.label}
                  </div>
                )}
              </div>
            </foreignObject>
          )}
        </g>
      );
    });
  };

  const gridSize = 28;

  return (
    <div className="h-screen w-full overflow-hidden relative bg-white" style={{ marginLeft: '0' }}>
      {/* Toolbar */}
      <NexusToolbar
        activeTool={activeTool}
        onToolChange={t => { setActiveTool(t); setConnectFrom(null); setTempLine(null); }}
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
        connectFrom={connectFrom}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-md text-gray-500 text-xs font-medium">
        <button onClick={() => setViewport(v => ({ ...v, zoom: Math.min(3, v.zoom * 1.2) }))} className="hover:text-gray-900 transition text-base leading-none">+</button>
        <span className="w-12 text-center font-mono text-gray-700">{Math.round(viewport.zoom * 100)}%</span>
        <button onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.15, v.zoom / 1.2) }))} className="hover:text-gray-900 transition text-base leading-none">−</button>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} className="hover:text-gray-900 transition">Reset</button>
      </div>

      {/* Connect mode banner */}
      {connectFrom && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 border border-amber-300 shadow-lg text-amber-800 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Click a second shape to connect — or press <kbd className="ml-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-xs font-mono">Esc</kbd> to cancel
        </div>
      )}

      {/* Empty canvas hint */}
      {shapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-dashed border-violet-200 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-violet-300" />
            </div>
            <div>
              <h3 className="text-gray-400 text-lg font-medium">Start Your Nexus</h3>
              <p className="text-gray-300 text-sm mt-1 max-w-xs mx-auto">
                Select a shape tool from the toolbar above, then click to place shapes
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-gray-300">
              <span className="flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> Click to place</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Double-click to edit</span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'connect' ? 'crosshair' : activeTool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg ref={svgRef} className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            {/* Dot grid */}
            <pattern id="dot-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse"
              patternTransform={`translate(${viewport.x % gridSize},${viewport.y % gridSize}) scale(${viewport.zoom})`}>
              <circle cx={gridSize / 2} cy={gridSize / 2} r="1.5" fill="#d1d5db" />
            </pattern>
            {/* Per-connection markers */}
            {connections.map(conn => (
              <g key={`defs-${conn.id}`}>
                <marker id={`dot-${conn.id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <circle cx="3" cy="3" r="2.5" fill={conn.color} />
                </marker>
                <marker id={`arrow-${conn.id}`} markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                  <path d="M 0 0 L 10 4 L 0 8 z" fill={selectedConnId === conn.id ? '#f59e0b' : conn.color} />
                </marker>
              </g>
            ))}
            {/* Temp line arrow */}
            <marker id="temp-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <path d="M 0 0 L 10 4 L 0 8 z" fill={connectionColor} opacity="0.6" />
            </marker>
          </defs>

          {/* White background + dot grid */}
          <rect x={0} y={0} width="100%" height="100%" fill="white" />
          <rect x={0} y={0} width="100%" height="100%" fill="url(#dot-grid)" />

          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
            {/* Connections below shapes */}
            {renderConnections()}

            {/* Temp line */}
            {tempLine && (
              <line
                x1={tempLine.x1} y1={tempLine.y1} x2={tempLine.x2} y2={tempLine.y2}
                stroke={connectionColor} strokeWidth={2} strokeDasharray="6 4" opacity={0.7}
                markerStart={`url(#dot-${connectFrom})`}
                markerEnd="url(#temp-arrow)"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Shapes on top */}
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

      {generatedTasks && (
        <TaskPanel tasks={generatedTasks} onClose={() => setGeneratedTasks(null)}
          onPushToTasks={handlePushToTasks} projects={projects} isPushing={isPushing} />
      )}
      {showCanvasList && (
        <CanvasList canvases={loadCanvases()} onSelect={handleLoadCanvas}
          onDelete={id => { deleteCanvasStorage(id); setShowCanvasList(false); setTimeout(() => setShowCanvasList(true), 10); }}
          onClose={() => setShowCanvasList(false)} />
      )}
    </div>
  );
}
