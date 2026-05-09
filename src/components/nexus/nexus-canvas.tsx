'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  NexusShape, NexusConnection, NexusPath, ToolMode, GeneratedTask,
  CanvasViewport, NexusCanvas as NexusCanvasData, CanvasTheme,
} from '@/types/nexus';
import { SHAPE_COLOR_PRESETS, CONNECTION_COLORS } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import { CollaborativeCursors } from './collaborative-cursors';
import { createTask as pushTask } from '@/app/(dashboard)/tasks/actions';
import { Sparkles, MousePointer2, Pencil, Lock, Unlock, Plus, Minus, Check } from 'lucide-react';
import { useSidebar } from '@/components/providers/sidebar-context';
import rough from 'roughjs';
import { v4 as uuidv4 } from 'uuid';
import { recognizeShape } from '@/lib/shape-recognition';

const roughGenerator = typeof window !== 'undefined' ? rough.generator() : null;

interface NexusCanvasProps {
  projects: { id: string; title: string }[];
  userId: string;
  className?: string;
}

export function NexusCanvas({ projects, userId, className }: NexusCanvasProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [shapes, setShapes] = useState<NexusShape[]>([]);
  const [connections, setConnections] = useState<NexusConnection[]>([]);
  const [paths, setPaths] = useState<NexusPath[]>([]);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [canvasId, setCanvasId] = useState<string>('');
  const [isEditingCanvasName, setIsEditingCanvasName] = useState(false);
  const [pendingCanvasName, setPendingCanvasName] = useState('');
  const canvasNameInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);
  // Refs so the debounced auto-save always writes the latest state
  const latestShapesRef = useRef(shapes);
  const latestConnectionsRef = useRef(connections);
  const latestPathsRef = useRef(paths);
  const latestCanvasNameRef = useRef(canvasName);
  const latestCanvasIdRef = useRef(canvasId);

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

  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ shapeId: string; offsetX: number; offsetY: number; initialPositions?: Record<string, { x: number; y: number }> } | null>(null);
  const [resizing, setResizing] = useState<{ shapeId: string; handle: string; startX: number; startY: number; startWidth: number; startHeight: number; startShapeX: number; startShapeY: number } | null>(null);
  const [rotating, setRotating] = useState<{ shapeId: string; startAngle: number; initialRotation: number; initialRotations?: Record<string, number> } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; startVpX: number; startVpY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [activePath, setActivePath] = useState<NexusPath | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[] | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [clipboard, setClipboard] = useState<NexusShape | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [alignmentLines, setAlignmentLines] = useState<{ x?: number, y?: number }[]>([]);
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>('hand-drawn');
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [toolbarOrientation, setToolbarOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

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
    const savedMinimap = localStorage.getItem('nexus-minimap');
    if (savedMinimap) {
      setShowMinimap(savedMinimap === 'true');
    }
    const savedOrientation = localStorage.getItem('nexus-toolbar-orientation');
    if (savedOrientation === 'horizontal' || savedOrientation === 'vertical') {
      setToolbarOrientation(savedOrientation);
    }

    // ── Restore last active canvas session ────────────────
    const activeId = localStorage.getItem('nexus-active-canvas-id');
    if (activeId) {
      const canvases = loadCanvases();
      const found = canvases.find(c => c.id === activeId);
      if (found) {
        isRestoringRef.current = true;
        setShapes(found.shapes);
        setConnections(found.connections);
        setPaths(found.paths || []);
        setCanvasName(found.name);
        setCanvasId(found.id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus-theme', canvasTheme);
  }, [canvasTheme]);

  useEffect(() => {
    localStorage.setItem('nexus-snap', snapToGrid.toString());
  }, [snapToGrid]);

  useEffect(() => {
    localStorage.setItem('nexus-minimap', showMinimap.toString());
  }, [showMinimap]);

  useEffect(() => {
    localStorage.setItem('nexus-toolbar-orientation', toolbarOrientation);
  }, [toolbarOrientation]);

  // ── Keep latest-value refs in sync ───────────────────
  useEffect(() => { latestShapesRef.current = shapes; }, [shapes]);
  useEffect(() => { latestConnectionsRef.current = connections; }, [connections]);
  useEffect(() => { latestPathsRef.current = paths; }, [paths]);
  useEffect(() => { latestCanvasNameRef.current = canvasName; }, [canvasName]);
  useEffect(() => { latestCanvasIdRef.current = canvasId; }, [canvasId]);

  // ── Debounced Auto-Save ───────────────────────────────
  // Triggered by any content change; uses refs to avoid stale closures.
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const id = latestCanvasIdRef.current || uuidv4();
      if (!latestCanvasIdRef.current) {
        latestCanvasIdRef.current = id;
        setCanvasId(id);
      }
      const canvas: NexusCanvasData = {
        id,
        name: latestCanvasNameRef.current,
        shapes: latestShapesRef.current,
        connections: latestConnectionsRef.current,
        paths: latestPathsRef.current,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveCanvas(canvas);
      localStorage.setItem('nexus-active-canvas-id', id);
    }, 800);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, connections, paths, canvasName]);

  // Focus name input when it opens
  useEffect(() => {
    if (isEditingCanvasName && canvasNameInputRef.current) {
      canvasNameInputRef.current.focus();
      canvasNameInputRef.current.select();
    }
  }, [isEditingCanvasName]);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  const handleRotateStart = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.isLocked) return;
    
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
    
    // Capture initial rotations for all selected shapes if the target is selected
    // Only include non-locked shapes in the rotation group
    const targets = selectedShapeIds.includes(shapeId) ? selectedShapeIds.filter(id => {
      const s = shapes.find(sh => sh.id === id);
      return s && !s.isLocked;
    }) : [shapeId];
    
    const initialRotations: Record<string, number> = {};
    targets.forEach(id => {
      const s = shapes.find(sh => sh.id === id);
      if (s) initialRotations[id] = s.rotation || 0;
    });

    setRotating({
      shapeId,
      startAngle: angle,
      initialRotation: shape.rotation || 0,
      initialRotations
    } as any);
  };

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
        setSelectedShapeIds([]);
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
        } else if (selectedShapeIds.length > 0) {
          const locked = shapes.filter(s => selectedShapeIds.includes(s.id) && s.isLocked);
          if (locked.length > 0) {
            toast.error("Locked items cannot be deleted");
            return;
          }
          const newShapes = shapes.filter(s => !selectedShapeIds.includes(s.id));
          const newConns = connections.filter(c => !selectedShapeIds.includes(c.fromShapeId) && !selectedShapeIds.includes(c.toShapeId));
          setShapes(newShapes);
          setConnections(newConns);
          saveToHistory(newShapes, newConns, paths);
          setSelectedShapeIds([]);
        }
      }
      else if ((e.ctrlKey || e.metaKey) && key === 'c' && selectedShapeIds.length === 1) {
        const shape = shapes.find(s => s.id === selectedShapeIds[0]);
        if (shape) setClipboard(shape);
      }
      else if ((e.ctrlKey || e.metaKey) && key === 'v' && clipboard) {
        const newShape = { ...clipboard, id: uuidv4(), x: clipboard.x + 20, y: clipboard.y + 20, zIndex: Date.now() };
        setShapes(prev => {
          const next = [...prev, newShape];
          saveToHistory(next, connections, paths);
          return next;
        });
        setSelectedShapeIds([newShape.id]);
      }
      else if ((e.ctrlKey || e.metaKey) && key === 'd' && selectedShapeIds.length === 1) {
        e.preventDefault();
        handleDuplicateShape(selectedShapeIds[0]);
      }
      else if (key === 'tab' && selectedShapeIds.length === 1) {
        e.preventDefault();
        handleAddChild(selectedShapeIds[0]);
      }
      else if (key === 'enter' && selectedShapeIds.length === 1 && !editingShapeId) {
        e.preventDefault();
        handleAddSibling(selectedShapeIds[0]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingShapeId, selectedShapeIds, selectedConnId, undo, redo, shapes, connections, paths, saveToHistory, clipboard]);

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
      if (activeTool === 'mindmap') {
        const newShape: NexusShape = {
          id: uuidv4(),
          type: 'rectangle', // Root node is a rectangle
          x, y,
          width: 200,
          height: 80,
          text: 'Central Topic',
          color: '#ede9fe', // Soft purple root
          borderColor: '#8b5cf6',
          textColor: '#4c1d95',
          fontSize: 18,
          zIndex: Date.now(),
          fontWeight: 'bold',
          textAlign: 'center',
        };
        setShapes(prev => {
          const next = [...prev, newShape];
          saveToHistory(next, connections, paths);
          return next;
        });
        setSelectedShapeIds([newShape.id]);
        setEditingShapeId(newShape.id);
        setActiveTool('select');
        return;
      }
      const shapeTypes: ToolMode[] = ['rectangle', 'circle', 'diamond', 'hexagon', 'parallelogram', 'text'];
      if (shapeTypes.includes(activeTool)) {
        const newShape = createShape(
          activeTool as any,
          x,
          y,
          activeColor.fill,
          activeColor.border,
          activeColor.text
        );
        // For text tool, override some defaults
        if (activeTool === 'text') {
          newShape.color = 'transparent';
          newShape.borderColor = 'transparent';
          newShape.textColor = '#1e293b';
          newShape.text = 'Double click to edit';
        }
        
        setShapes(prev => {
          const next = [...prev, newShape];
          saveToHistory(next, connections, paths);
          return next;
        });
        setSelectedShapeIds([newShape.id]);
        setActiveTool('select');
        if (activeTool === 'text') setEditingShapeId(newShape.id);
        return;
      }
      
      if (activeTool === 'arrow') {
        if (connectFrom) {
          // Second click of a click-to-click connection
          const waypointId = uuidv4();
          const waypoint: NexusShape = {
            id: waypointId, type: 'circle',
            x: x - 10, y: y - 10, width: 20, height: 20,
            text: '', color: '#ffffff', borderColor: connectionColor,
            textColor: '#000000', fontSize: 10, zIndex: Date.now(),
          };
          const newConn = createConnection(connectFrom, waypointId, connectionColor, 'straight');
          setShapes(prev => [...prev, waypoint]);
          setConnections(prev => [...prev, newConn]);
          saveToHistory([...shapes, waypoint], [...connections, newConn], paths);
          setActiveTool('select');
          setSelectedConnId(newConn.id);
          setConnectFrom(null);
          setTempLine(null);
          return;
        } else {
          // Starting a new arrow
          const waypointId = uuidv4();
          const waypoint: NexusShape = {
            id: waypointId, type: 'circle',
            x: x - 10, y: y - 10, width: 20, height: 20,
            text: '', color: '#ffffff', borderColor: connectionColor,
            textColor: '#000000', fontSize: 10, zIndex: Date.now(),
          };
          setShapes(prev => [...prev, waypoint]);
          setConnectFrom(waypointId);
          setTempLine({ x1: x, y1: y, x2: x, y2: y });
          return;
        }
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

    if (activeTool === 'select') {
      setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
      setSelectedConnId(null);
      setEditingShapeId(null);
      setEditingConnId(null);
      return;
    }
    
    setSelectedShapeIds([]);
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

    if (activeTool === 'connect' || activeTool === 'arrow') {
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
          const newConn = createConnection(connectFrom, shapeId, connectionColor);
          if (activeTool === 'arrow') {
             // For Arrow tool, we default to straight line since it's a "free arrow"
             newConn.routing = 'straight';
          }
          setConnections(prev => [...prev, newConn]);
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

    if (activeTool === 'mindmap') {
      handleAddChild(shapeId);
      return;
    }

    if (activeTool === 'select') {
      if (e.shiftKey) {
        setSelectedShapeIds(prev => prev.includes(shapeId) ? prev.filter(id => id !== shapeId) : [...prev, shapeId]);
      } else {
        setSelectedShapeIds([shapeId]);
      }
      setSelectedConnId(null);
      setEditingShapeId(null);
      setEditingConnId(null);
      
      // Physical Locking: only allow dragging if NOT locked
      if (!shape.isLocked) {
        setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, zIndex: Date.now() } : s));
        
        // Capture initial positions for all selected items (filtering out locked ones)
        const currentSelection = e.shiftKey 
          ? (selectedShapeIds.includes(shapeId) ? selectedShapeIds : [...selectedShapeIds, shapeId])
          : [shapeId];
          
        const initialPositions: Record<string, { x: number, y: number }> = {};
        currentSelection.forEach(id => {
          const s = shapes.find(sh => sh.id === id);
          if (s && !s.isLocked) initialPositions[id] = { x: s.x, y: s.y };
        });

        setDragging({ shapeId, offsetX: x - shape.x, offsetY: y - shape.y, initialPositions });
      }
    }
  };

  const handleResizeStart = (e: React.MouseEvent, shapeId: string, handle: string) => {
    e.stopPropagation();
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.isLocked) return;
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
    setSelectedShapeIds([]);
    setEditingConnId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionBox) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
      return;
    }
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
      const dx = x - (dragging.offsetX + (shapes.find(s => s.id === dragging.shapeId)?.x || 0)); // This is tricky, let's use a simpler diff
      // Let's use mouse delta
      const currentShape = shapes.find(s => s.id === dragging.shapeId);
      if (!currentShape) return;
      
      let newX = x - dragging.offsetX;
      let newY = y - dragging.offsetY;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      const moveDx = newX - currentShape.x;
      const moveDy = newY - currentShape.y;

      // Smart Alignment logic (only for the main dragged shape)
      const guides: { x?: number, y?: number }[] = [];
      shapes.forEach(other => {
        if (other.id === dragging.shapeId || (dragging.initialPositions && dragging.initialPositions[other.id])) return;
        const thresh = 5;
        if (Math.abs(newX - other.x) < thresh) { 
          newX = other.x; 
          guides.push({ x: other.x }); 
        }
        if (Math.abs(newY - other.y) < thresh) { 
          newY = other.y; 
          guides.push({ y: other.y }); 
        }
      });
      setAlignmentLines(guides);

      const targets = dragging.initialPositions ? Object.keys(dragging.initialPositions) : [dragging.shapeId];
      
      setShapes(prev => prev.map(s => {
        if (targets.includes(s.id)) {
          // If it's the main shape, use the calculated newX/newY (with snapping/guides)
          if (s.id === dragging.shapeId) return { ...s, x: newX, y: newY };
          // For others, apply the same delta
          return { ...s, x: s.x + moveDx, y: s.y + moveDy };
        }
        return s;
      }));
      return;
    }
    if (rotating) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const shape = shapes.find(s => s.id === (rotating as any).shapeId);
      if (shape) {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const currentAngle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
        const rotationDiff = currentAngle - (rotating as any).startAngle;
        
        const targets = (rotating as any).initialRotations ? Object.keys((rotating as any).initialRotations) : [(rotating as any).shapeId];
        
        setShapes(prev => prev.map(s => {
          if (targets.includes(s.id)) {
            const initial = (rotating as any).initialRotations ? (rotating as any).initialRotations[s.id] : (rotating as any).initialRotation;
            let newRotation = (initial + rotationDiff) % 360;
            if (e.shiftKey) newRotation = Math.round(newRotation / 15) * 15;
            return { ...s, rotation: newRotation };
          }
          return s;
        }));
      }
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

  const handleMouseUp = (e: React.MouseEvent) => { 
    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
      const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
      const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
      const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

      const inBox = shapes.filter(s => {
        const sx1 = s.x;
        const sy1 = s.y;
        const sx2 = s.x + s.width;
        const sy2 = s.y + s.height;
        return sx1 >= x1 && sx2 <= x2 && sy1 >= y1 && sy2 <= y2;
      }).map(s => s.id);

      if (e.shiftKey) {
        setSelectedShapeIds(prev => Array.from(new Set([...prev, ...inBox])));
      } else {
        setSelectedShapeIds(inBox);
      }
      setSelectionBox(null);
      return;
    }
    if (activeTool === 'arrow' && connectFrom && tempLine) {
      // Check if we dropped on a shape
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      // Give precedence to non-waypoint shapes, then fall back to waypoints
      const hitShape = [...shapes].sort((a,b) => b.zIndex - a.zIndex).find(s => 
        s.id !== connectFrom && 
        x >= s.x && x <= s.x + s.width && 
        y >= s.y && y <= s.y + s.height
      );

      if (hitShape) {
        const newConn = createConnection(connectFrom, hitShape.id, connectionColor, 'straight');
        setConnections(prev => [...prev, newConn]);
        saveToHistory(shapes, [...connections, newConn], paths);
      } else {
        // Did we actually drag, or just click?
        const dx = Math.abs(tempLine.x2 - tempLine.x1);
        const dy = Math.abs(tempLine.y2 - tempLine.y1);
        if (dx > 5 || dy > 5) {
          const waypointId = uuidv4();
          const waypoint: NexusShape = {
            id: waypointId,
            type: 'circle',
            x: x - 10, y: y - 10,
            width: 20, height: 20,
            text: '', color: '#ffffff', borderColor: connectionColor,
            textColor: '#000000', fontSize: 10, zIndex: Date.now(),
          };
          const newConn = createConnection(connectFrom, waypointId, connectionColor, 'straight');
          setShapes(prev => [...prev, waypoint]);
          setConnections(prev => [...prev, newConn]);
          saveToHistory([...shapes, waypoint], [...connections, newConn], paths);
          setActiveTool('select');
          setSelectedConnId(newConn.id);
        } else {
          // It was a click, not a drag. 
          const fromShape = shapes.find(s => s.id === connectFrom);
          if (fromShape && fromShape.type === 'circle' && fromShape.width === 20) {
            // Clicked empty space to start, but didn't drag. Cancel.
            setShapes(prev => prev.filter(s => s.id !== connectFrom));
            setConnectFrom(null);
            setTempLine(null);
          } else {
            // Clicked a real shape! Keep connectFrom active so they can click the target.
            // We just return and do NOT clear connectFrom.
            return;
          }
        }
      }
      
      setConnectFrom(null);
      setTempLine(null);
      return;
    }

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
    if (rotating) {
      saveToHistory(shapes, connections, paths);
      setRotating(null);
    }
    if (resizing) {
      saveToHistory(shapes, connections, paths);
      setResizing(null);
    }
    if (dragging) {
      const draggedShape = shapes.find(s => s.id === dragging.shapeId);
      // If we are dragging a waypoint
      if (draggedShape && draggedShape.type === 'circle' && draggedShape.width === 20) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        // Find a real shape under the drop location
        const targetShape = [...shapes].sort((a,b) => b.zIndex - a.zIndex).find(s => 
          s.id !== draggedShape.id && 
          s.type !== 'circle' && // Assuming we only snap to non-waypoints
          x >= s.x && x <= s.x + s.width && 
          y >= s.y && y <= s.y + s.height
        );

        if (targetShape) {
          // Re-route all connections attached to the waypoint to the new target shape
          setConnections(prev => prev.map(c => {
            if (c.fromShapeId === draggedShape.id) return { ...c, fromShapeId: targetShape.id };
            if (c.toShapeId === draggedShape.id) return { ...c, toShapeId: targetShape.id };
            return c;
          }));
          // Delete the waypoint
          setShapes(prev => prev.filter(s => s.id !== draggedShape.id));
        }
      }
      
      saveToHistory(shapes, connections, paths);
      setDragging(null);
    }
    setAlignmentLines([]);
    setPanning(null); 
  };
  const handleDoubleClick = (shapeId: string) => { 
    setEditingShapeId(shapeId); 
    setEditingConnId(null);
    setSelectedShapeIds([shapeId]); 
  };
  
  const handleConnDoubleClick = (connId: string) => {
    setEditingConnId(connId);
    setEditingShapeId(null);
    setSelectedConnId(connId);
  };

  const handleShapeContextMenu = (e: React.MouseEvent, shapeId: string) => {
    // Right click triggers selection to show property ribbon
    setSelectedShapeIds([shapeId]);
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
    setSelectedShapeIds([newShape.id]);
  };

  const handleAddChild = (parentId: string, requestedDirection?: 'left' | 'right' | 'top' | 'bottom') => {
    const parent = shapes.find(s => s.id === parentId);
    if (!parent) return;

    // Determine direction: if root, try to balance; if not, follow parent's lead
    const incoming = connections.find(c => c.toShapeId === parentId);
    let direction: 'left' | 'right' | 'top' | 'bottom' = requestedDirection || 'right';
    
    if (!requestedDirection) {
      if (incoming) {
        const grandParent = shapes.find(s => s.id === incoming.fromShapeId);
        if (grandParent) direction = parent.x > grandParent.x ? 'right' : 'left';
      } else {
        // It's a root. Count existing children to balance.
        const children = connections.filter(c => c.fromShapeId === parentId);
        const rightCount = children.filter(c => {
          const child = shapes.find(s => s.id === c.toShapeId);
          return child && child.x > parent.x;
        }).length;
        const leftCount = children.length - rightCount;
        direction = rightCount <= leftCount ? 'right' : 'left';
      }
    }

    const siblings = connections
      .filter(c => c.fromShapeId === parentId)
      .map(c => shapes.find(s => s.id === c.toShapeId))
      .filter((s): s is NexusShape => !!s && (direction === 'right' ? s.x > parent.x : s.x < parent.x));

    const offsetHorizontal = 160;
    const offsetVertical = 60;
    
    let newX = parent.x;
    let newY = parent.y;

    if (direction === 'right') newX = parent.x + parent.width + offsetHorizontal;
    else if (direction === 'left') newX = parent.x - offsetHorizontal - 120;
    else if (direction === 'top') newY = parent.y - offsetVertical - 40;
    else if (direction === 'bottom') newY = parent.y + parent.height + offsetVertical;

    if (siblings.length > 0) {
      // Position below the last sibling
      const lastSibling = siblings.sort((a, b) => b.y - a.y)[0];
      newY = lastSibling.y + lastSibling.height + 20;
      // Re-center all siblings for logical flow
      const totalHeight = (siblings.length + 1) * offsetVertical;
      const startY = parent.y + parent.height / 2 - totalHeight / 2;
      // We'll skip complex auto-layout for now and just stack
    }

    const childId = uuidv4();
    const isFirstLevel = !incoming;
    const branchColor = isFirstLevel 
      ? CONNECTION_COLORS[connections.filter(c => !connections.find(pc => pc.toShapeId === c.fromShapeId)).length % CONNECTION_COLORS.length]
      : (connections.find(c => c.toShapeId === parentId)?.color || '#3b82f6');

    const newChild: NexusShape = {
      ...parent,
      id: childId,
      x: newX,
      y: newY,
      text: parent.type === 'text' ? parent.text : (parent.text ? `Sub: ${parent.text}` : 'New Node'),
      zIndex: Date.now(),
      isLocked: false,
      // Only override textAlign if it's a mindmap-node specifically, otherwise keep parent's alignment
      textAlign: parent.type === 'mindmap-node' ? (direction === 'right' ? 'left' : 'right') : (parent.textAlign || 'center'),
    };

    const newConn = createConnection(parentId, childId, branchColor, 'mindmap');
    newConn.strokeWidth = isFirstLevel ? 2.5 : 1.5;

    setShapes(prev => [...prev, newChild]);
    setConnections(prev => [...prev, newConn]);
    saveToHistory([...shapes, newChild], [...connections, newConn], paths);
    setSelectedShapeIds([childId]);
    setEditingShapeId(childId);
  };

  const handleAddSibling = (targetId: string) => {
    const target = shapes.find(s => s.id === targetId);
    const parentConn = connections.find(c => c.toShapeId === targetId);
    if (!target || !parentConn) return;

    const parentId = parentConn.fromShapeId;
    const parent = shapes.find(s => s.id === parentId);
    if (!parent) return;

    const siblingId = uuidv4();
    const newSibling: NexusShape = {
      ...target,
      id: siblingId,
      y: target.y + target.height + 20,
      text: 'New Sibling',
      zIndex: Date.now(),
    };

    const newConn = createConnection(parentId, siblingId, parentConn.color, 'mindmap');
    newConn.strokeWidth = parentConn.strokeWidth;

    setShapes(prev => [...prev, newSibling]);
    setConnections(prev => [...prev, newConn]);
    saveToHistory([...shapes, newSibling], [...connections, newConn], paths);
    setSelectedShapeIds([siblingId]);
    setEditingShapeId(siblingId);
  };

  const deleteSelectedShape = () => {
    if (selectedShapeIds.length === 0) return;
    const newShapes = shapes.filter(s => !selectedShapeIds.includes(s.id));
    const newConns = connections.filter(c => !selectedShapeIds.includes(c.fromShapeId) && !selectedShapeIds.includes(c.toShapeId));
    setShapes(newShapes);
    setConnections(newConns);
    saveToHistory(newShapes, newConns, paths);
    setSelectedShapeIds([]);
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
    const id = canvasId || uuidv4();
    const canvas: NexusCanvasData = { id, name: canvasName, shapes, connections, paths, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!canvasId) setCanvasId(id);
    saveCanvas(canvas);
    localStorage.setItem('nexus-active-canvas-id', id);
    toast.success('Canvas saved!');
  };

  const handleLoadCanvas = (canvas: NexusCanvasData) => {
    isRestoringRef.current = true;
    setShapes(canvas.shapes); setConnections(canvas.connections); setPaths(canvas.paths || []);
    setCanvasName(canvas.name); setCanvasId(canvas.id);
    localStorage.setItem('nexus-active-canvas-id', canvas.id);
    setShowCanvasList(false); setSelectedShapeIds([]); setEditingShapeId(null);
    toast.success(`Loaded "${canvas.name}"`);
  };

  const handleNewCanvas = () => {
    localStorage.removeItem('nexus-active-canvas-id');
    setShapes([]); setConnections([]); setPaths([]); setCanvasName('Untitled Canvas');
    setCanvasId(''); setSelectedShapeIds([]); setEditingShapeId(null);
    setGeneratedTasks(null); setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const handleClear = () => {
    if (shapes.length === 0 && paths.length === 0) return;
    saveToHistory(shapes, connections, paths);
    setShapes([]); setConnections([]); setPaths([]);
    setSelectedShapeIds([]); setEditingShapeId(null);
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

  const handleToggleLock = (targetId?: string | any) => {
    const targets = typeof targetId === 'string' ? [targetId] : selectedShapeIds;
    if (targets.length === 0) return;

    setShapes(prev => {
      const allLocked = prev.filter(s => targets.includes(s.id)).every(s => !!s.isLocked);
      const nextLockedState = !allLocked;
      const nextShapes = prev.map(s => 
        targets.includes(s.id) ? { ...s, isLocked: nextLockedState } : s
      );
      
      // Save to history with the next state
      saveToHistory(nextShapes, connections, paths);
      
      // Feedback
      if (nextLockedState) toast.success("Items locked");
      else toast.info("Items unlocked");
      
      return nextShapes;
    });
  };

  const handleSplitConn = useCallback((connId: string) => {
    const conn = connections.find(c => c.id === connId);
    if (!conn) return;

    const fromShape = shapes.find(s => s.id === conn.fromShapeId);
    const toShape = shapes.find(s => s.id === conn.toShapeId);
    if (!fromShape || !toShape) return;

    // Midpoint
    const midX = (fromShape.x + fromShape.width/2 + toShape.x + toShape.width/2) / 2;
    const midY = (fromShape.y + fromShape.height/2 + toShape.y + toShape.height/2) / 2;

    const waypointId = uuidv4();
    const waypoint: NexusShape = {
      id: waypointId,
      type: 'circle',
      x: midX - 10,
      y: midY - 10,
      width: 20,
      height: 20,
      text: '',
      color: '#ffffff',
      borderColor: conn.color,
      textColor: '#000000',
      fontSize: 10,
      zIndex: Date.now(),
    };

    const newConn1 = createConnection(conn.fromShapeId, waypointId, conn.color, conn.routing);
    newConn1.startMarker = conn.startMarker;
    newConn1.endMarker = 'none';

    const newConn2 = createConnection(waypointId, conn.toShapeId, conn.color, conn.routing);
    newConn2.startMarker = 'none';
    newConn2.endMarker = conn.endMarker;

    setShapes(prev => [...prev, waypoint]);
    setConnections(prev => [...prev.filter(c => c.id !== connId), newConn1, newConn2]);
    setSelectedConnId(null);
    setSelectedShapeIds([waypointId]);
    setConnectFrom(waypointId); // Ready to drag a new connection from this waypoint
    setActiveTool('arrow'); // Ensure they are in arrow mode to finish the branch
    
    saveToHistory([...shapes, waypoint], [...connections.filter(c => c.id !== connId), newConn1, newConn2], paths);
  }, [connections, shapes, saveToHistory]);

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

  const commitCanvasName = () => {
    const trimmed = pendingCanvasName.trim();
    if (trimmed) setCanvasName(trimmed);
    setIsEditingCanvasName(false);
  };

  return (
    <div className={cn("w-full overflow-hidden relative bg-white", className || "h-screen")} style={{ marginLeft: '0' }}>
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
        showMinimap={showMinimap}
        onShowMinimapChange={setShowMinimap}
        orientation={toolbarOrientation}
        onOrientationChange={setToolbarOrientation}
        zoom={viewport.zoom}
        onZoomChange={(z) => setViewport(v => ({ ...v, zoom: z }))}
        onResetZoom={() => setViewport({ x: 0, y: 0, zoom: 1 })}
        isSidebarCollapsed={isCollapsed}
        onToggleSidebar={toggleSidebar}
      />


      {/* Connect mode banner - Moved to top center */}
      {connectFrom && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3 rounded-full bg-gray-900/95 backdrop-blur-md shadow-2xl text-white text-sm font-medium animate-in slide-in-from-top-4 duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse ring-4 ring-blue-500/20" />
          Click a second shape to connect
          <kbd className="ml-2 px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">Esc</kbd> to cancel
        </div>
      )}



      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: activeTool === 'pan' ? 'grab' : (activeTool === 'connect' || activeTool === 'arrow') ? 'crosshair' : activeTool === 'select' ? 'default' : 'crosshair' }}
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
                <marker id={`dot-${conn.id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <circle cx="3" cy="3" r="2.5" fill={conn.color} />
                </marker>
                <marker id={`arrow-${conn.id}`} markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 4 L 0 8 z" fill={selectedConnId === conn.id ? '#f59e0b' : conn.color} />
                </marker>
                <marker id={`diamond-${conn.id}`} markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto-start-reverse">
                  <path d="M 0 6 L 6 0 L 12 6 L 6 12 z" fill={conn.color} />
                </marker>
              </g>
            ))}
            {/* Temp line arrow */}
            <marker id="temp-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 4 L 0 8 z" fill={connectionColor} opacity="0.6" />
            </marker>
            <marker id="temp-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
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
                onSplitConn={handleSplitConn}
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

            {/* Selection Box */}
            {selectionBox && (
              <rect
                x={Math.min(selectionBox.startX, selectionBox.currentX)}
                y={Math.min(selectionBox.startY, selectionBox.currentY)}
                width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4 4"
                rx={2}
                ry={2}
              />
            )}

            {/* Shapes on top */}
            {[...shapes].sort((a, b) => a.zIndex - b.zIndex).map(shape => (
              <ShapeRenderer
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeIds.includes(shape.id)}
                isConnectSource={connectFrom === shape.id}
                zoom={viewport.zoom}
                onMouseDown={handleShapeMouseDown}
                onDoubleClick={handleDoubleClick}
                onTextChange={handleTextChange}
                onContextMenu={handleShapeContextMenu}
                onResizeStart={handleResizeStart}
                onRotateStart={handleRotateStart}
                onToggleLock={handleToggleLock}
                editingShapeId={editingShapeId}
                canvasTheme={canvasTheme}
                activeTool={activeTool}
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
            {/* Collaborative cursors in canvas space */}
            <foreignObject x={-5000} y={-5000} width={10000} height={10000} style={{ pointerEvents: 'none' }}>
              <CollaborativeCursors />
            </foreignObject>
          </g>
        </svg>
      </div>

      {/* ── Canvas Name Badge ────────────────────────────────────────── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2"
        style={{ pointerEvents: 'auto' }}
      >
        {isEditingCanvasName ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 border border-blue-300 shadow-lg backdrop-blur-md ring-2 ring-blue-500/20 animate-in zoom-in-95 duration-150">
            <input
              ref={canvasNameInputRef}
              value={pendingCanvasName}
              onChange={e => setPendingCanvasName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitCanvasName();
                if (e.key === 'Escape') setIsEditingCanvasName(false);
              }}
              onBlur={commitCanvasName}
              className="text-sm font-semibold text-gray-800 bg-transparent outline-none w-44 placeholder:text-gray-400"
              placeholder="Canvas name…"
              maxLength={60}
            />
            <button
              onMouseDown={e => { e.preventDefault(); commitCanvasName(); }}
              className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setPendingCanvasName(canvasName); setIsEditingCanvasName(true); }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-black/[0.06] shadow-sm backdrop-blur-md hover:bg-white hover:border-black/10 hover:shadow-md transition-all duration-200"
            title="Rename canvas"
          >
            <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors max-w-[200px] truncate">
              {canvasName}
            </span>
            <Pencil className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100" />
          </button>
        )}

        {/* Auto-save indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 border border-black/[0.04] backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Auto-saved</span>
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <CanvasMinimap 
          shapes={shapes} 
          viewport={viewport} 
          containerWidth={containerDimensions.width} 
          containerHeight={containerDimensions.height} 
          onNavigate={(x, y) => setViewport(v => ({ ...v, x, y }))}
        />
      )}

      {selectedShapeIds.length === 1 && shapes.find(s => s.id === selectedShapeIds[0]) && activeTool === 'select' && !editingShapeId && (
        <ShapeProperties
          shape={shapes.find(s => s.id === selectedShapeIds[0])!}
          onColorChange={(f, b, t) => updateShapeColor(selectedShapeIds[0], f, b, t)}
          onTypeChange={(t) => updateShapeType(selectedShapeIds[0], t)}
          onDelete={deleteSelectedShape}
          onDuplicate={() => handleDuplicateShape(selectedShapeIds[0])}
          onAddChild={(dir) => handleAddChild(selectedShapeIds[0], dir)}
          onFontSizeChange={(size) => updateShapeFontSize(selectedShapeIds[0], size)}
          onPropertyChange={(updates) => handleUpdateShapeProperty(selectedShapeIds[0], updates)}
          onToggleLock={handleToggleLock}
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
