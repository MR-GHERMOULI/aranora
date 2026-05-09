'use client';

import { cn } from '@/lib/utils';
import type { ToolMode, CanvasTheme } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS, CONNECTION_COLORS } from '@/types/nexus';
import {
  MousePointer2, Hand, Square, Circle, Diamond, Hexagon,
  Link2, Sparkles, Save, Trash2, FolderOpen, Plus, ChevronUp,
  Undo, Redo, PenLine, Pencil, Highlighter, Paintbrush, Eraser,
  GripHorizontal, Palette, Settings2, Scissors, Type, Network, GitBranch, ArrowRight,
  Minus, RotateCcw, Layout, Menu, ChevronLeft
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolbarProps {
  activeTool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  activeColor: { fill: string; border: string; text: string };
  onColorChange: (fill: string, border: string, text: string) => void;
  connectionColor: string;
  onConnectionColorChange: (color: string) => void;
  onConvert: () => void;
  onSave: () => void;
  onClear: () => void;
  onNewCanvas: () => void;
  onLoadCanvas: () => void;
  onExport: () => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snap: boolean) => void;
  canvasName: string;
  onCanvasNameChange: (name: string) => void;
  shapeCount: number;
  connectionCount: number;
  isConverting: boolean;
  connectFrom: string | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  penConfig: { type: 'pen' | 'illustration' | 'highlighter', color: string, width: number };
  onPenConfigChange: (config: { type: 'pen' | 'illustration' | 'highlighter', color: string, width: number }) => void;
  canvasTheme: CanvasTheme;
  onThemeChange: (theme: CanvasTheme) => void;
  showMinimap: boolean;
  onShowMinimapChange: (show: boolean) => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetZoom: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const toolGroups = [
  {
    id: 'select',
    label: 'Navigation',
    tools: [
      { mode: 'select', icon: MousePointer2, label: 'Select (V)' },
      { mode: 'pan', icon: Hand, label: 'Hand (H)' },
    ]
  },
  {
    id: 'shapes',
    label: 'Creation',
    tools: [
      { mode: 'rectangle', icon: Square, label: 'Rectangle (R)' },
      { mode: 'circle', icon: Circle, label: 'Circle (C)' },
      { mode: 'diamond', icon: Diamond, label: 'Diamond (D)' },
      { mode: 'hexagon', icon: Hexagon, label: 'Hexagon (X)' },
      { mode: 'parallelogram', icon: Square, label: 'Parallelogram (Z)' },
    ]
  },
  {
    id: 'connect',
    label: 'Relationships',
    tools: [
      { mode: 'arrow', icon: ArrowRight, label: 'Free Arrow (A)' },
      { mode: 'connect', icon: Link2, label: 'Connect Shapes (L)' },
    ]
  },
  {
    id: 'art',
    label: 'Drawing',
    tools: [
      { mode: 'pen', icon: PenLine, label: 'Pen (P)' },
      { mode: 'eraser', icon: Eraser, label: 'Eraser (E)' },
      { mode: 'text', icon: Type, label: 'Text (T)' },
    ]
  },
  {
    id: 'mindmap',
    label: 'Mind Map',
    tools: [
      { mode: 'mindmap', icon: Network, label: 'Mind Map Mode' },
    ]
  }
];

export function NexusToolbar({
  activeTool, onToolChange, activeColor, onColorChange,
  connectionColor, onConnectionColorChange,
  onConvert, onSave, onClear, onNewCanvas, onLoadCanvas, onExport,
  snapToGrid, onSnapToGridChange,
  canvasName, onCanvasNameChange, shapeCount, connectionCount,
  isConverting, connectFrom,
  onUndo, onRedo, canUndo, canRedo,
  penConfig, onPenConfigChange,
  canvasTheme, onThemeChange,
  showMinimap, onShowMinimapChange,
  orientation, onOrientationChange,
  zoom, onZoomChange, onResetZoom,
  isSidebarCollapsed, onToggleSidebar,
}: ToolbarProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<'style' | 'actions' | null>(null);

  // Close menus when active tool changes (e.g. via keyboard shortcuts)
  useEffect(() => {
    setActiveGroup(null);
  }, [activeTool]);

  // Ensure mutual exclusivity between flyouts and config popovers
  const toggleGroup = (groupId: string) => {
    setActiveGroup(activeGroup === groupId ? null : groupId);
    setShowConfig(null);
  };

  const toggleConfig = (config: 'style' | 'actions') => {
    setShowConfig(showConfig === config ? null : config);
    setActiveGroup(null);
  };
  const constraintsRef = useRef(null);

  return (
    <div className={cn(
      "fixed pointer-events-none flex items-center justify-center z-50 transition-all duration-700",
      orientation === 'horizontal' 
        ? "bottom-8 left-0 right-0" 
        : cn("top-6 bottom-auto", isSidebarCollapsed ? "left-6" : "left-[312px]")
    )}>
      
      {/* Non-Draggable Dock */}
      <div 
        className={cn(
          "pointer-events-auto flex items-center p-1 rounded-[1.8rem] bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.02] transition-all duration-500",
          orientation === 'vertical' ? 'flex-col py-2 px-1 gap-0.5 min-w-[48px]' : 'flex-row px-2.5 py-1 gap-0.5 min-h-[48px]'
        )}
      >
        {/* Sidebar Toggle Integration */}
        <div className={cn("flex items-center", orientation === 'vertical' ? 'flex-col mb-1' : 'flex-row mr-1')}>
          <button 
            onClick={onToggleSidebar}
            className={cn(
              "p-2 rounded-xl transition-all shadow-md active:scale-95",
              isSidebarCollapsed ? "bg-gray-100 text-gray-500" : "bg-gray-900 text-white"
            )}
            title={isSidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
          >
            {isSidebarCollapsed ? <Menu className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
          <div className={cn("bg-black/[0.06]", orientation === 'vertical' ? 'w-8 h-px mt-1' : 'w-px h-6 ml-1')} />
        </div>

        {/* Zoom Controls Integration */}
        <div className={cn("flex items-center gap-0.5 bg-black/[0.02] p-0.5 rounded-lg", orientation === 'vertical' ? 'flex-col mb-1' : 'flex-row mr-0.5')}>
          <button onClick={() => onZoomChange(Math.min(3, zoom * 1.2))} className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all active:scale-90">
            <Plus className="h-3 w-3" />
          </button>
          <div className={cn("flex items-center justify-center", orientation === 'vertical' ? 'py-0.5' : 'px-0.5 min-w-[36px]')}>
            <span className="text-[8px] font-bold font-mono text-gray-900 tracking-tighter">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <button onClick={() => onZoomChange(Math.max(0.15, zoom / 1.2))} className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all active:scale-90">
            <Minus className="h-3 w-3" />
          </button>
        </div>

        <div className={cn("bg-black/[0.06]", orientation === 'vertical' ? 'w-8 h-px my-1' : 'w-px h-8 mx-1')} />

        {/* History Group */}
        <div className={cn("flex items-center gap-0.5", orientation === 'vertical' ? 'flex-col py-0.5' : 'flex-row px-0.5')}>
          <button onClick={onUndo} disabled={!canUndo} 
            className={cn("p-1.5 rounded-lg transition-all", canUndo ? "text-gray-600 hover:bg-black/[0.04] active:scale-95" : "text-gray-300 cursor-not-allowed")}>
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRedo} disabled={!canRedo} 
            className={cn("p-1.5 rounded-lg transition-all", canRedo ? "text-gray-600 hover:bg-black/[0.04] active:scale-95" : "text-gray-300 cursor-not-allowed")}>
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className={cn("bg-black/[0.06]", orientation === 'vertical' ? 'w-8 h-px my-1' : 'w-px h-8 mx-1')} />

        {/* Dynamic Tool Groups */}
        <div className={cn("flex items-center gap-1", orientation === 'vertical' ? 'flex-col py-1' : 'flex-row px-1')}>
          {toolGroups.map((group) => {
            const isActive = group.tools.some(t => t.mode === activeTool);
            const currentTool = group.tools.find(t => t.mode === activeTool) || group.tools[0];

            return (
              <div key={group.id} className="relative">
                <button
                  onClick={() => {
                    if (group.tools.length === 1) onToolChange(group.tools[0].mode as ToolMode);
                    else toggleGroup(group.id);
                  }}
                  onDoubleClick={() => onToolChange(currentTool.mode as ToolMode)}
                  className={cn(
                    "relative p-2 rounded-lg transition-all duration-300 group",
                    isActive 
                      ? "bg-gray-900 text-white shadow-md shadow-gray-900/10" 
                      : "text-gray-500 hover:bg-black/[0.03] hover:text-gray-900"
                  )}
                >
                  <currentTool.icon className="h-4 w-4 relative z-10" />
                  {group.tools.length > 1 && (
                    <div className={cn(
                      "absolute bottom-1 right-1 w-1 h-1 rounded-full bg-current opacity-40",
                      isActive ? "bg-white" : ""
                    )} />
                  )}
                </button>

                {/* Adobe-style Flyout */}
                <AnimatePresence>
                  {activeGroup === group.id && (
                    <motion.div
                      initial={{ opacity: 0, x: orientation === 'vertical' ? 20 : 0, y: orientation === 'vertical' ? 0 : 10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: orientation === 'vertical' ? 20 : 0, y: orientation === 'vertical' ? 0 : 10, scale: 0.95 }}
                      className={cn(
                        "absolute p-2 rounded-3xl bg-white border border-black/[0.06] shadow-2xl min-w-[160px] z-[100]",
                        orientation === 'vertical' ? 'left-full ml-4 top-1/2 -translate-y-1/2' : 'bottom-full mb-4 left-1/2 -translate-x-1/2'
                      )}
                    >
                      <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-black/[0.03] mb-1">
                        {group.label}
                      </div>
                      <div className="grid gap-1">
                        {group.tools.map(tool => (
                          <button
                            key={tool.mode}
                            onClick={() => { onToolChange(tool.mode as ToolMode); setActiveGroup(null); }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                              activeTool === tool.mode ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <tool.icon className="h-4 w-4" />
                            <span>{tool.label}</span>
                          </button>
                        ))}
                      </div>
                      {/* Arrow */}
                      <div className={cn(
                        "absolute w-3 h-3 bg-white border border-black/[0.06] rotate-45",
                        orientation === 'vertical' ? '-left-1.5 top-1/2 -translate-y-1/2 border-t-0 border-r-0' : '-bottom-1.5 left-1/2 -translate-x-1/2 border-l-0 border-t-0'
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className={cn("bg-black/[0.06]", orientation === 'vertical' ? 'w-8 h-px my-1' : 'w-px h-8 mx-1')} />

        {/* Styling & Config */}
        <div className={cn("flex items-center gap-1", orientation === 'vertical' ? 'flex-col py-1' : 'flex-row px-1')}>
          {/* Palette (Color & Pen) */}
          <button 
            onClick={() => toggleConfig('style')}
            className={cn(
              "p-2 rounded-lg transition-all",
              showConfig === 'style' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-black/[0.03]"
            )}
          >
            <Palette className="h-4 w-4" />
          </button>

          {/* Quick Actions (Save, Load, etc) */}
          <button 
            onClick={() => toggleConfig('actions')}
            className={cn(
              "p-2 rounded-lg transition-all",
              showConfig === 'actions' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-black/[0.03]"
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {/* Orientation Toggle */}
          <button 
            onClick={() => onOrientationChange(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
            className="p-2 rounded-lg transition-all text-gray-500 hover:bg-black/[0.03] hover:text-gray-900"
            title={orientation === 'horizontal' ? "Dock to Left" : "Dock to Bottom"}
          >
            <Layout className={cn("h-4 w-4", orientation === 'vertical' ? 'rotate-90' : '')} />
          </button>
        </div>

        <div className={cn("bg-black/[0.06]", orientation === 'vertical' ? 'w-8 h-px my-1' : 'w-px h-8 mx-1')} />

        {/* AI Magic Button */}
        <div className={cn("px-0.5", orientation === 'vertical' ? 'pt-0.5' : 'pl-0.5')}>
          <button 
            onClick={() => { onConvert(); setActiveGroup(null); setShowConfig(null); }}
            disabled={shapeCount === 0 || isConverting}
            className={cn(
              'flex items-center justify-center rounded-lg font-bold text-xs transition-all relative overflow-hidden group shadow-sm shadow-gray-900/5',
              orientation === 'vertical' ? 'w-8 h-8' : 'px-3 py-2',
              shapeCount > 0 && !isConverting ? 'bg-gray-900 text-white hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Sparkles className={cn('h-3.5 w-3.5 relative z-10', isConverting && 'animate-spin')} />
            {orientation === 'horizontal' && (
              <span className="ml-1 relative z-10 uppercase tracking-tighter text-[9px]">{isConverting ? '...' : 'Gen Tasks'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Config Popovers */}
      <AnimatePresence>
        {showConfig === 'style' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto p-6 rounded-[2.5rem] bg-white border border-black/[0.06] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.25)] flex gap-8 z-[110]"
          >
            {/* Shape Palette */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">Geometric Colors</span>
              <div className="grid grid-cols-4 gap-2.5">
                {SHAPE_COLOR_PRESETS.slice(0, 12).map(p => (
                  <button key={p.name} onClick={() => { onColorChange(p.fill, p.border, p.text); setShowConfig(null); }}
                    className={cn('w-8 h-8 rounded-full border border-black/5 transition-all hover:scale-125 ring-offset-4 ring-gray-900', activeColor.fill === p.fill ? "ring-2" : "")}
                    style={{ background: p.fill }} />
                ))}
              </div>
            </div>

            <div className="w-px bg-black/[0.05]" />

            {/* Pen Palette */}
            <div className="space-y-5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">Art Config</span>
              <div className="flex gap-2.5">
                {[{ id: 'pen', icon: PenLine, label: 'Pen' }, { id: 'illustration', icon: Pencil, label: 'Brush' }, { id: 'highlighter', icon: Highlighter, label: 'Glow' }].map(t => (
                  <button key={t.id} onClick={() => { onPenConfigChange({ ...penConfig, type: t.id as any }); setShowConfig(null); }}
                    className={cn("flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all", penConfig.type === t.id ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "border-gray-100 text-gray-400 hover:bg-gray-50")}>
                    <t.icon className="h-4 w-4" />
                    <span className="text-[8px] font-bold uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase px-1"><span>Ink Size</span><span>{penConfig.width}px</span></div>
                <input type="range" min="1" max="20" value={penConfig.width} onChange={e => onPenConfigChange({ ...penConfig, width: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-emerald-500" />
              </div>
            </div>

            <div className="w-px bg-black/[0.05]" />

            {/* Editor Config */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">Editor Settings</span>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { onSnapToGridChange(!snapToGrid); setShowConfig(null); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-xs font-bold",
                    snapToGrid ? "bg-blue-50 border-blue-200 text-blue-600" : "border-gray-100 text-gray-400 hover:bg-gray-50"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", snapToGrid ? "bg-blue-500" : "bg-gray-300")} />
                  Snap to Grid
                </button>

                <button
                  onClick={() => { onShowMinimapChange(!showMinimap); setShowConfig(null); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-xs font-bold",
                    showMinimap ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "border-gray-100 text-gray-400 hover:bg-gray-50"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", showMinimap ? "bg-emerald-500" : "bg-gray-300")} />
                  Show Navigator
                </button>

                <div className="p-1.5 bg-gray-50 rounded-2xl flex gap-1">
                  <button
                    onClick={() => { onThemeChange('flat'); setShowConfig(null); }}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all",
                      canvasTheme === 'flat' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Elegant
                  </button>
                  <button
                    onClick={() => { onThemeChange('hand-drawn'); setShowConfig(null); }}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all",
                      canvasTheme === 'hand-drawn' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Sketch
                  </button>
                </div>

                <div className="p-1.5 bg-gray-50 rounded-2xl flex gap-1">
                  <button
                    onClick={() => { onOrientationChange('horizontal'); setShowConfig(null); }}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all",
                      orientation === 'horizontal' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Horizontal
                  </button>
                  <button
                    onClick={() => { onOrientationChange('vertical'); setShowConfig(null); }}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all",
                      orientation === 'vertical' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Vertical
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showConfig === 'actions' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto p-2 rounded-[2rem] bg-white border border-black/[0.06] shadow-2xl flex gap-1 z-[110]"
          >
            {[
              { onClick: onSave, icon: Save, label: 'Save', color: 'hover:text-emerald-600 hover:bg-emerald-50' },
              { onClick: onLoadCanvas, icon: FolderOpen, label: 'Open', color: 'hover:text-blue-600 hover:bg-blue-50' },
              { onClick: onNewCanvas, icon: Plus, label: 'New', color: 'hover:text-violet-600 hover:bg-violet-50' },
              { onClick: onExport, icon: Paintbrush, label: 'PNG', color: 'hover:text-amber-600 hover:bg-amber-50' },
              { onClick: onClear, icon: Trash2, label: 'Clear', color: 'hover:text-red-600 hover:bg-red-50' },
            ].map(a => (
              <button key={a.label} onClick={() => { a.onClick(); setShowConfig(null); }} className={cn("flex flex-col items-center gap-1 p-3.5 rounded-2xl transition-all group", a.color)}>
                <a.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{a.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
