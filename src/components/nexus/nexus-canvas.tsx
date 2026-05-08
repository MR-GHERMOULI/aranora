'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  NexusShape, NexusConnection, NexusPath, ToolMode, GeneratedTask,
  CanvasViewport, NexusCanvas as NexusCanvasData, CanvasTheme,
} from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import { cn } from '@/lib/utils';
import {
  createShape, createConnection, getConnectionPath,
  saveCanvas, loadCanvases, deleteCanvas as deleteCanvasStorage,
} from '@/lib/nexus/canvas-helpers';
import { convertCanvasToTasks } from '@/lib/nexus/converter';
import { NexusToolbar } from './nexus-toolbar';
import { ShapeRenderer } from './shape-renderer';
import { ShapeProperties } from './shape-properties';
import { TaskPanel } from './task-panel';
import { CanvasList } from './canvas-list';
import { ConnectionLine } from './connection-line';
import { CanvasMinimap } from './canvas-minimap';
import { createTask as pushTask } from '@/app/(dashboard)/tasks/actions';
import { toast } from 'sonner';
import { Sparkles, MousePointer2, Pencil } from 'lucide-react';
import rough from 'roughjs';
import { v4 as uuidv4 } from 'uuid';
import { recognizeShape } from '@/lib/shape-recognition';

const roughGenerator = typeof window !== 'undefined' ? rough.generator() : null;

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
  // Refs are the source of truth — prevents stale-closure bugs
  // when saveToHistory is called inside batched state updates.
  const [history, setHistory] = useState<{ shapes: NexusShape[], connections: NexusConnection[], paths: NexusPath[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<typeof history>([]);
  const historyIndexRef = useRef(-1);

  const saveToHistory = useCallback((s: NexusShape[], c: NexusConnection[], p: NexusPath[]) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push({ shapes: s, connections: c, paths: p });
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      setShapes(state.shapes);
      setConnections(state.connections);
      setPaths(state.paths);
      setHistoryIndex(historyIndexRef.current);
    } else if (historyIndexRef.current === 0) {
      historyIndexRef.current = -1;
      setShapes([]); setConnections([]); setPaths([]);
      setHistoryIndex(-1);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      setShapes(state.shapes);
      setConnections(state.connections);
      setPaths(state.paths);
      setHistoryIndex(historyIndexRef.current);
    }
  }, []);

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
  const [clipboard, setClipboard] = useState<NexusShape | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [alignmentLines, setAlignmentLines] = useState<{ x?: number, y?: number }[]>([]);
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>('hand-drawn');
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width, height });
    }
    // Load preferences
    const savedTheme = localStorage.getItem('nexus-theme');
    if (savedTheme === 'flat' || savedTheme === 'hand-drawn') {
      setCanvasTheme(savedTheme as CanvasTheme);
    }
    const savedGrid = localStorage.getItem('nexus-snap');
    if (savedGrid) {
      setSnapToGrid(savedGrid === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus-theme', canvasTheme);
  }, [canvasTheme]);

  useEffect(() => {
    localStorage.setItem('nexus-snap', snapToGrid.toString());
  }, [snapToGrid]);

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
      else if (key === 'z') setActiveTool('parallelogram');
      else if (key === 't') setActiveTool('text');
      else if (key === 'l') setActiveTool('connect');
      else if (key === 'delete' || key === 'backspace') {
        if (selectedConnId) {
          const newConns = connections.filter(c => c.id !== selectedConnId);
          setConnections(newConns);
          saveToHistory(shapes, newConns, paths);
          setSelectedConnId(null);
        } else if (selectedShapeId) {
          const newShapes = shapes.filter(s => s.id !== selectedShapeId);
          const newConns = connections.filter(c => c.fromShapeId !== selectedShapeId && c.toShapeId !== selectedShapeId);
          setShapes(newShapes);
          setConnections(newConns);
          saveToHistory(newShapes, newConns, paths);
          setSelectedShapeId(null);
        }
      }
      else if ((e.ctrlKey || e.metaKey) && key === 'c' && selectedShapeId) {
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (shape) setClipboard(shape);
      }
      else if ((e.ctrlKey || e.metaKey) && key === 'v' && clipboard) {
        const newShape = { ...clipboard, id: uuidv4(), x: clipboard.x + 20, y: clipboard.y + 20, zIndex: Date.now() };
        setShapes(prev => {
          const next = [...prev, newShape];
          saveToHistory(next, connections, paths);
          return next;
        });
        setSelectedShapeId(newShape.id);
      }
      else if ((e.ctrlKey || e.metaKey) && key === 'd' && selectedShapeId) {
        e.preventDefault();
        handleDuplicateShape(selectedShapeId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingShapeId, selectedShapeId, selectedConnId, undo, redo, shapes, connections, paths, saveToHistory]);

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
    const shapeTypes: ToolMode[] = ['rectangle', 'circle', 'diamond', 'hexagon', 'parallelogram', 'text'];
    if (shapeTypes.includes(activeTool as any)) {
      const newShape: NexusShape = {
        id: uuidv4(),
        type: activeTool as any,
        x, y,
        width: activeTool === 'text' ? 160 : 120,
        height: activeTool === 'text' ? 60 : 80,
        text: activeTool === 'text' ? 'Start typing...' : '',
        color: activeTool === 'text' ? 'transparent' : activeColor.fill,
        borderColor: activeTool === 'text' ? 'transparent' : activeColor.border,
        textColor: activeTool === 'text' ? '#0f172a' : activeColor.text,
        fontSize: activeTool === 'text' ? 16 : 14,
        zIndex: Date.now(),
      };
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
        id: uuidv4(),
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
      let newX = x - dragging.offsetX;
      let newY = y - dragging.offsetY;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      // Smart Alignment logic
      const guides: { x?: number, y?: number }[] = [];
      const currentShape = shapes.find(s => s.id === dragging.shapeId);
      if (currentShape) {
        shapes.forEach(other => {
          if (other.id === dragging.shapeId) return;
          const thresh = 5;
          if (Math.abs(newX - other.x) < thresh) { 
            newX = other.x; 
            guides.push({ x: other.x }); 
          }
          if (Math.abs(newX + currentShape.width - (other.x + other.width)) < thresh) { 
            newX = other.x + other.width - currentShape.width; 
            guides.push({ x: other.x + other.width }); 
          }
          if (Math.abs(newY - other.y) < thresh) { 
            newY = other.y; 
            guides.push({ y: other.y }); 
          }
          if (Math.abs(newY + currentShape.height - (other.y + other.height)) < thresh) { 
            newY = other.y + other.height - currentShape.height; 
            guides.push({ y: other.y + other.height }); 
          }
        });
      }
      setAlignmentLines(guides);

      setShapes(prev => prev.map(s =>
        s.id === dragging.shapeId ? { ...s, x: newX, y: newY } : s
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

        if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
          width = Math.round(width / gridSize) * gridSize;
          height = Math.round(height / gridSize) * gridSize;
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
      // SMART DRAWING: Analyze if the path looks like a geometric shape
      const recognized = recognizeShape(activePath.points);
      
      if (recognized && activeTool === 'pen') {
        const newShape: NexusShape = {
          id: uuidv4(),
          type: recognized.type,
          x: recognized.x,
          y: recognized.y,
          width: recognized.width,
          height: recognized.height,
          text: '',
          color: activeColor.fill,
          borderColor: activeColor.border,
          textColor: activeColor.text,
          fontSize: 14,
          zIndex: Date.now(),
        };
        
        setShapes(prev => {
          const next = [...prev, newShape];
          saveToHistory(next, connections, paths);
          return next;
        });
        
        toast.success(`Converted to ${recognized.type}`, {
          icon: '✨',
          description: 'Smart Drawing recognized your shape.'
        });
        setActivePath(null);
      } else {
        setPaths(prev => {
          const next = [...prev, activePath];
          saveToHistory(shapes, connections, next);
          return next;
        });
        setActivePath(null);
      }
    }
    if (resizing) {
      saveToHistory(shapes, connections, paths);
      setResizing(null);
    }
    if (dragging) {
      saveToHistory(shapes, connections, paths);
      setDragging(null);
    }
    setAlignmentLines([]);
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

  const handleDuplicateShape = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    const newShape = { ...shape, id: uuidv4(), x: shape.x + 20, y: shape.y + 20, zIndex: Date.now() };
    setShapes(prev => {
      const next = [...prev, newShape];
      saveToHistory(next, connections, paths);
      return next;
    });
    setSelectedShapeId(newShape.id);
  };

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return;
    const newShapes = shapes.filter(s => s.id !== selectedShapeId);
    const newConns = connections.filter(c => c.fromShapeId !== selectedShapeId && c.toShapeId !== selectedShapeId);
    setShapes(newShapes);
    setConnections(newConns);
    saveToHistory(newShapes, newConns, paths);
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
    const canvas: NexusCanvasData = { id: canvasId || uuidv4(), name: canvasName, shapes, connections, paths, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
    saveToHistory(shapes, connections, paths);
    setShapes([]); setConnections([]); setPaths([]);
    setSelectedShapeId(null); setEditingShapeId(null);
    toast.info('Canvas cleared');
  };

  // ── Connection callbacks for ConnectionLine component ──
  const handleUpdateConn = useCallback((connId: string, updates: Partial<NexusConnection>) => {
    setConnections(prev => prev.map(c => c.id === connId ? { ...c, ...updates } : c));
  }, []);

  const handleConnLabelChange = useCallback((connId: string, label: string) => {
    setConnections(prev => prev.map(c => c.id === connId ? { ...c, label } : c));
  }, []);

  const handleFinishEditingConn = useCallback(() => {
    setEditingConnId(null);
  }, []);

  const handleExportPNG = async () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth;
      canvas.height = svg.clientHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${canvasName}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Canvas list refresh key (replaces setTimeout hack)
  const [canvasListKey, setCanvasListKey] = useState(0);

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
        onExport={handleExportPNG}
        snapToGrid={snapToGrid}
        onSnapToGridChange={setSnapToGrid}
        canvasName={canvasName}
        onCanvasNameChange={setCanvasName}
        shapeCount={shapes.length}
        connectionCount={connections.length}
        isConverting={isConverting}
        connectFrom={connectFrom}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndexRef.current >= 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        penConfig={penConfig}
        onPenConfigChange={setPenConfig}
        canvasTheme={canvasTheme}
        onThemeChange={setCanvasTheme}
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
            <marker id="temp-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <circle cx="3" cy="3" r="2.5" fill={connectionColor} opacity="0.6" />
            </marker>

            {/* Paper Texture Filter */}
            <filter id="paper-texture" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
              <feDiffuseLighting in="noise" lightingColor="#fffcf5" surfaceScale="2">
                <feDistantLight azimuth="45" elevation="60" />
              </feDiffuseLighting>
            </filter>
          </defs>

          {/* White background + dot grid */}
          <rect x={0} y={0} width="100%" height="100%" 
            fill={canvasTheme === 'hand-drawn' ? '#fffcf5' : 'white'} 
            filter={canvasTheme === 'hand-drawn' ? 'url(#paper-texture)' : 'none'}
          />
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
            {connections.map(conn => (
              <ConnectionLine
                key={conn.id}
                conn={conn}
                shapes={shapes}
                isSelected={selectedConnId === conn.id}
                isEditing={editingConnId === conn.id}
                onSelect={handleConnClick}
                onDoubleClick={handleConnDoubleClick}
                onUpdateConn={handleUpdateConn}
                onLabelChange={handleConnLabelChange}
                onFinishEditing={handleFinishEditingConn}
                canvasTheme={canvasTheme}
              />
            ))}

            {/* Temp line */}
            {tempLine && (
              <path
                d={getConnectionPath(tempLine.x1, tempLine.y1, tempLine.x2, tempLine.y2) || ''}
                stroke={connectionColor} strokeWidth={2} strokeDasharray="6 4" opacity={0.7} fill="none"
                markerStart="url(#temp-dot)"
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
                canvasTheme={canvasTheme}
              />
            ))}

            {/* Alignment Guides */}
            {alignmentLines.map((line, i) => (
              <line
                key={i}
                x1={line.x !== undefined ? line.x : -10000}
                y1={line.y !== undefined ? line.y : -10000}
                x2={line.x !== undefined ? line.x : 10000}
                y2={line.y !== undefined ? line.y : 10000}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.5}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Minimap */}
      <CanvasMinimap 
        shapes={shapes} 
        viewport={viewport} 
        containerWidth={containerDimensions.width} 
        containerHeight={containerDimensions.height} 
        onNavigate={(x, y) => setViewport(v => ({ ...v, x, y }))}
      />

      {selectedShapeId && shapes.find(s => s.id === selectedShapeId) && activeTool === 'select' && !editingShapeId && (
        <ShapeProperties
          shape={shapes.find(s => s.id === selectedShapeId)!}
          onColorChange={(f, b, t) => updateShapeColor(selectedShapeId, f, b, t)}
          onTypeChange={(t) => updateShapeType(selectedShapeId, t)}
          onDelete={deleteSelectedShape}
          onDuplicate={() => handleDuplicateShape(selectedShapeId)}
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
        <CanvasList key={canvasListKey} canvases={loadCanvases()} onSelect={handleLoadCanvas}
          onDelete={id => { deleteCanvasStorage(id); setCanvasListKey(k => k + 1); }}
          onClose={() => setShowCanvasList(false)} />
      )}
    </div>
  );
}
