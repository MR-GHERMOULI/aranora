'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  NexusShape, NexusConnection, NexusPath, ToolMode, GeneratedTask,
  CanvasViewport, NexusCanvas as NexusCanvasData,
} from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import { cn } from '@/lib/utils';
import {
  createShape, createConnection, getConnectionPoints, getConnectionPath,
  saveCanvas, loadCanvases, deleteCanvas as deleteCanvasStorage,
} from '@/lib/nexus/canvas-helpers';
import { convertCanvasToTasks } from '@/lib/nexus/converter';
import { NexusToolbar } from './nexus-toolbar';
import { ShapeRenderer } from './shape-renderer';
import { ShapeProperties } from './shape-properties';
import { TaskPanel } from './task-panel';
import { CanvasList } from './canvas-list';
import { createTask as pushTask } from '@/app/(dashboard)/tasks/actions';
import { toast } from 'sonner';
import { Sparkles, MousePointer2, Zap, Pencil } from 'lucide-react';
import rough from 'roughjs';

const generator = rough.generator();

interface NexusCanvasProps {
  projects: { id: string; title: string }[];
  userId: string;
}

export function NexusCanvas({ projects, userId }: NexusCanvasProps) {
  const [shapes, setShapes] = useState<NexusShape[]>([]);
  const [connections, setConnections] = useState<NexusConnection[]>([]);
  const [paths, setPaths] = useState<NexusPath[]>([]);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [canvasId, setCanvasId] = useState<string>('');

  // ── History (Undo/Redo) ──────────────────────────────
  const [history, setHistory] = useState<{ shapes: NexusShape[], connections: NexusConnection[], paths: NexusPath[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((s: NexusShape[], c: NexusConnection[], p: NexusPath[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, { shapes: s, connections: c, paths: p }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const state = history[historyIndex - 1];
      setShapes(state.shapes);
      setConnections(state.connections);
      setPaths(state.paths);
      setHistoryIndex(prev => prev - 1);
    } else if (historyIndex === 0) {
      setShapes([]); setConnections([]); setPaths([]);
      setHistoryIndex(-1);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const state = history[historyIndex + 1];
      setShapes(state.shapes);
      setConnections(state.connections);
      setPaths(state.paths);
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history]);

  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [activeColor, setActiveColor] = useState(SHAPE_COLOR_PRESETS[0]);
  const [connectionColor, setConnectionColor] = useState('#3b82f6');
  const [penConfig, setPenConfig] = useState<{ type: 'pen' | 'illustration' | 'highlighter', color: string, width: number }>({
    type: 'pen',
    color: '#000000',
    width: 2
  });

  const [viewport, setViewport] = useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ shapeId: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ shapeId: string; handle: string; startX: number; startY: number; startWidth: number; startHeight: number; startShapeX: number; startShapeY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; startVpX: number; startVpY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [activePath, setActivePath] = useState<NexusPath | null>(null);

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
        setActivePath(null);
        setSelectedShapeId(null);
        setSelectedConnId(null);
        setEditingShapeId(null);
        setEditingConnId(null);
        setActiveTool('select');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        if (e.shiftKey) redo(); else undo();
        e.preventDefault();
      }
      if (key === 'v') setActiveTool('select');
      else if (key === 'h') setActiveTool('pan');
      else if (key === 'p') setActiveTool('pen');
      else if (key === 'e') setActiveTool('eraser');
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
      setShapes(prev => {
        const next = [...prev, newShape];
        saveToHistory(next, connections, paths);
        return next;
      });
      setSelectedShapeId(newShape.id);
      setEditingShapeId(newShape.id);
      setActiveTool('select');
      return;
    }
    if (activeTool === 'pen') {
      const newPath: NexusPath = {
        id: crypto.randomUUID(),
        points: [{ x, y }],
        color: penConfig.color,
        strokeWidth: penConfig.type === 'illustration' ? penConfig.width * 2.5 : penConfig.width,
        type: penConfig.type,
        opacity: penConfig.type === 'highlighter' ? 0.35 : 1
      };
      setActivePath(newPath);
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

  const handleResizeStart = (e: React.MouseEvent, shapeId: string, handle: string) => {
    e.stopPropagation();
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    setResizing({
      shapeId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: shape.width,
      startHeight: shape.height,
      startShapeX: shape.x,
      startShapeY: shape.y
    });
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
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / viewport.zoom;
      const dy = (e.clientY - resizing.startY) / viewport.zoom;
      const minSize = 40;

      setShapes(prev => prev.map(s => {
        if (s.id !== resizing.shapeId) return s;
        let { x, y, width, height } = s;

        if (resizing.handle.includes('e')) width = Math.max(minSize, resizing.startWidth + dx);
        if (resizing.handle.includes('s')) height = Math.max(minSize, resizing.startHeight + dy);
        if (resizing.handle.includes('w')) {
          const newWidth = Math.max(minSize, resizing.startWidth - dx);
          if (newWidth > minSize) {
            width = newWidth;
            x = resizing.startShapeX + dx;
          }
        }
        if (resizing.handle.includes('n')) {
          const newHeight = Math.max(minSize, resizing.startHeight - dy);
          if (newHeight > minSize) {
            height = newHeight;
            y = resizing.startShapeY + dy;
          }
        }

        return { ...s, x, y, width, height };
      }));
      return;
    }
    if (connectFrom) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const fromShape = shapes.find(s => s.id === connectFrom);
      if (fromShape) {
        setTempLine({ x1: fromShape.x + fromShape.width / 2, y1: fromShape.y + fromShape.height / 2, x2: x, y2: y });
      }
    }
    if (activePath) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setActivePath(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
    }
  };

  const handleMouseUp = () => { 
    if (activePath) {
      setPaths(prev => {
        const next = [...prev, activePath];
        saveToHistory(shapes, connections, next);
        return next;
      });
      setActivePath(null);
    }
    if (resizing) {
      saveToHistory(shapes, connections, paths);
      setResizing(null);
    }
    setDragging(null); 
    setPanning(null); 
  };
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

  const handleShapeContextMenu = (e: React.MouseEvent, shapeId: string) => {
    // Right click triggers selection to show property ribbon
    setSelectedShapeId(shapeId);
    setSelectedConnId(null);
    setEditingShapeId(null);
    setEditingConnId(null);
  };

  const handleTextChange = (shapeId: string, text: string) => setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, text } : s));

  const updateShapeColor = (shapeId: string, fill: string, border: string, text: string) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, color: fill, borderColor: border, textColor: text } : s));
  };

  const updateShapeType = (shapeId: string, type: NexusShape['type']) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, type } : s));
  };

  const updateShapeFontSize = (shapeId: string, fontSize: number) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, fontSize } : s));
  };

  const handleUpdateShapeProperty = (shapeId: string, updates: Partial<NexusShape>) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, ...updates } : s));
  };

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return;
    setShapes(prev => {
      const next = prev.filter(s => s.id !== selectedShapeId);
      saveToHistory(next, connections, paths);
      return next;
    });
    setConnections(prev => prev.filter(c => c.fromShapeId !== selectedShapeId && c.toShapeId !== selectedShapeId));
    setSelectedShapeId(null);
  };

  const handleErasePath = (pathId: string) => {
    setPaths(prev => {
      const next = prev.filter(p => p.id !== pathId);
      if (next.length !== prev.length) {
        saveToHistory(shapes, connections, next);
      }
      return next;
    });
  };

  const handleZoom = (delta: number) => setViewport(prev => ({ ...prev, zoom: Math.min(Math.max(0.1, prev.zoom + delta), 3) }));

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
    const canvas: NexusCanvasData = { id: canvasId || crypto.randomUUID(), name: canvasName, shapes, connections, paths, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!canvasId) setCanvasId(canvas.id);
    saveCanvas(canvas);
    toast.success('Canvas saved!');
  };

  const handleLoadCanvas = (canvas: NexusCanvasData) => {
    setShapes(canvas.shapes); setConnections(canvas.connections); setPaths(canvas.paths || []);
    setCanvasName(canvas.name); setCanvasId(canvas.id);
    setShowCanvasList(false); setSelectedShapeId(null); setEditingShapeId(null);
    toast.success(`Loaded "${canvas.name}"`);
  };

  const handleNewCanvas = () => {
    setShapes([]); setConnections([]); setPaths([]); setCanvasName('Untitled Canvas');
    setCanvasId(''); setSelectedShapeId(null); setEditingShapeId(null);
    setGeneratedTasks(null); setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const handleClear = () => {
    if (shapes.length === 0 && paths.length === 0) return;
    setShapes([]); setConnections([]); setPaths([]);
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
      const pathData = getConnectionPath(pts.x1, pts.y1, pts.x2, pts.y2);

      return (
        <g 
          key={conn.id}
          onDoubleClick={(e) => { e.stopPropagation(); handleConnDoubleClick(conn.id); }}
        >
          {/* Invisible wide hit area for click */}
          <path
            d={pathData}
            stroke="transparent" strokeWidth={24} fill="none"
            style={{ cursor: 'pointer' }}
            onClick={e => handleConnClick(e, conn.id)}
          />
          
          {/* Selection Glow */}
          {isSelected && (
            <path
              d={pathData}
              stroke="#3b82f6" strokeWidth={conn.strokeWidth + 8} fill="none"
              strokeOpacity={0.2}
              style={{ pointerEvents: 'none' }}
              className="transition-all duration-300"
            />
          )}

          {/* Hand-Drawn Connection Line */}
          {useMemo(() => {
            const drawable = generator.path(pathData, {
              stroke: isSelected ? '#3b82f6' : conn.color,
              strokeWidth: isSelected ? conn.strokeWidth + 0.5 : conn.strokeWidth,
              roughness: 0.8,
              bowing: 1.2,
              seed: 1,
            });
            return generator.toPaths(drawable).map((p, i) => (
              <path
                key={`line-${i}`}
                d={p}
                stroke={isSelected ? '#3b82f6' : conn.color}
                fill="none"
                strokeWidth={isSelected ? conn.strokeWidth + 0.5 : conn.strokeWidth}
                strokeLinecap="round"
                markerStart={i === 0 ? `url(#dot-${conn.id})` : 'none'}
                markerEnd={i === 0 ? `url(#arrow-${conn.id})` : 'none'}
                style={{ pointerEvents: 'none' }}
              />
            ));
          }, [pathData, isSelected, conn.color, conn.strokeWidth])}

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
                    className="w-28 px-3 py-1 bg-white/90 backdrop-blur border-2 border-blue-500 rounded-xl text-[11px] font-bold text-center shadow-2xl outline-none"
                    placeholder="Label..."
                  />
                ) : (
                  <div className={cn(
                    "px-3 py-1 bg-white border rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap transition-all",
                    isSelected ? "border-blue-500 text-blue-600 scale-110 shadow-md" : "border-gray-200 text-gray-700"
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
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        penConfig={penConfig}
        onPenConfigChange={setPenConfig}
      />

      {/* Zoom controls - Moved to top left since dock is at bottom */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-sm text-gray-600 text-xs font-bold tracking-tight">
        <button onClick={() => setViewport(v => ({ ...v, zoom: Math.min(3, v.zoom * 1.2) }))} className="p-1.5 hover:bg-gray-100 rounded-lg hover:text-gray-900 transition text-sm leading-none">+</button>
        <span className="w-10 text-center font-mono">{Math.round(viewport.zoom * 100)}%</span>
        <button onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.15, v.zoom / 1.2) }))} className="p-1.5 hover:bg-gray-100 rounded-lg hover:text-gray-900 transition text-sm leading-none">−</button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} className="p-1.5 hover:bg-gray-100 rounded-lg hover:text-gray-900 transition uppercase text-[9px] tracking-widest">Reset</button>
      </div>

      {/* Connect mode banner - Moved to top center */}
      {connectFrom && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3 rounded-full bg-gray-900/95 backdrop-blur-md shadow-2xl text-white text-sm font-medium animate-in slide-in-from-top-4 duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse ring-4 ring-blue-500/20" />
          Click a second shape to connect
          <kbd className="ml-2 px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">Esc</kbd> to cancel
        </div>
      )}

      {/* Empty canvas hint */}
      {shapes.length === 0 && paths.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
            {/* Indicative Logo Composition */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-blue-500/10 rounded-[2.5rem] blur-2xl animate-pulse" />
              <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50 border border-blue-100 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <div className="flex items-center justify-center relative">
                  <Pencil className="h-10 w-10 text-blue-600 rotate-[-15deg] absolute -translate-x-4 -translate-y-2 opacity-20" />
                  <MousePointer2 className="h-12 w-12 text-blue-600 relative z-10" />
                  <Sparkles className="h-8 w-8 text-amber-500 absolute translate-x-6 translate-y-4" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-gray-900 text-4xl font-extrabold tracking-tight">
                Aranora <span className="text-blue-600">Nexus</span>
              </h3>
              <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed font-medium">
                Elevate your raw ideas into <span className="text-gray-900">structured reality</span>. 
                Our professional suite combines precision geometry with fluid freehand tools to help you 
                visualize complex workflows on the <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">Aranora platform</span>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-8 text-[11px] uppercase tracking-[0.2em] font-black text-gray-400">
              <span className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-xl shadow-black/5 border border-black/[0.03]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Precision Design
              </span>
              <span className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-xl shadow-black/5 border border-black/[0.03]">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                AI-Ready Suite
              </span>
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
            {/* Freehand paths */}
            {[...paths, ...(activePath ? [activePath] : [])].map(path => (
              <path
                key={path.id}
                d={path.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={activeTool === 'eraser' ? path.opacity * 0.5 : path.opacity}
                style={{ 
                  pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none',
                  cursor: activeTool === 'eraser' ? 'crosshair' : 'default',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeTool === 'eraser' && e.buttons === 1) handleErasePath(path.id);
                }}
                onMouseDown={(e) => {
                  if (activeTool === 'eraser') handleErasePath(path.id);
                }}
              />
            ))}

            {/* Connections below shapes */}
            {renderConnections()}

            {/* Temp line */}
            {tempLine && (
              <path
                d={getConnectionPath(tempLine.x1, tempLine.y1, tempLine.x2, tempLine.y2)}
                stroke={connectionColor} strokeWidth={2} strokeDasharray="6 4" opacity={0.7} fill="none"
                markerStart={`url(#dot-${connectFrom})`}
                markerEnd="url(#temp-arrow)"
                style={{ pointerEvents: 'none' }}
                className="animate-[dash_1s_linear_infinite]"
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
                onContextMenu={handleShapeContextMenu}
                onResizeStart={handleResizeStart}
                editingShapeId={editingShapeId}
              />
            ))}
          </g>
        </svg>
      </div>

      {selectedShapeId && shapes.find(s => s.id === selectedShapeId) && activeTool === 'select' && !editingShapeId && (
        <ShapeProperties
          shape={shapes.find(s => s.id === selectedShapeId)!}
          onColorChange={(f, b, t) => updateShapeColor(selectedShapeId, f, b, t)}
          onTypeChange={(t) => updateShapeType(selectedShapeId, t)}
          onDelete={deleteSelectedShape}
          onFontSizeChange={(size) => updateShapeFontSize(selectedShapeId, size)}
          onPropertyChange={(updates) => handleUpdateShapeProperty(selectedShapeId, updates)}
          zoom={viewport.zoom}
          viewport={viewport}
        />
      )}

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
