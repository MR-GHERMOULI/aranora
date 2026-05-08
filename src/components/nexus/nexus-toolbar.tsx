'use client';

import { cn } from '@/lib/utils';
import type { ToolMode, CanvasTheme } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS, CONNECTION_COLORS } from '@/types/nexus';
import {
  MousePointer2, Hand, Square, Circle, Diamond, Hexagon,
  Link2, Sparkles, Save, Trash2, FolderOpen, Plus, ChevronUp,
  Undo, Redo, PenLine, Pencil, Highlighter, Paintbrush, Eraser,
  GripHorizontal, Palette, Settings2, Scissors, Type, Network, GitBranch
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
      { mode: 'connect', icon: Link2, label: 'Connect (L)' },
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
    <div className="fixed bottom-8 left-0 right-0 pointer-events-none flex flex-col items-center gap-6 z-50" ref={constraintsRef}>
      
      {/* Draggable Dock */}
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="pointer-events-auto flex items-center p-2.5 rounded-[2rem] bg-white/90 backdrop-blur-3xl border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.02)] ring-1 ring-black/[0.03]"
      >
        {/* Drag Handle */}
        <div className="px-2 py-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors">
          <GripHorizontal className="h-5 w-5" />
        </div>

        <div className="w-px h-8 bg-black/[0.06] mx-1" />

        {/* History Group */}
        <div className="flex items-center gap-1 px-2">
          <button onClick={onUndo} disabled={!canUndo} 
            className={cn("p-2.5 rounded-2xl transition-all", canUndo ? "text-gray-600 hover:bg-black/[0.04] active:scale-95" : "text-gray-300 cursor-not-allowed")}>
            <Undo className="h-4 w-4" />
          </button>
          <button onClick={onRedo} disabled={!canRedo} 
            className={cn("p-2.5 rounded-2xl transition-all", canRedo ? "text-gray-600 hover:bg-black/[0.04] active:scale-95" : "text-gray-300 cursor-not-allowed")}>
            <Redo className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-8 bg-black/[0.06] mx-1" />

        {/* Dynamic Tool Groups */}
        <div className="flex items-center gap-1.5 px-2">
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
                    "relative p-3.5 rounded-2xl transition-all duration-300 group",
                    isActive 
                      ? "bg-gray-900 text-white shadow-xl shadow-gray-900/20" 
                      : "text-gray-500 hover:bg-black/[0.04] hover:text-gray-900"
                  )}
                >
                  <currentTool.icon className="h-5 w-5 relative z-10" />
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
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 p-2 rounded-3xl bg-white border border-black/[0.06] shadow-2xl min-w-[160px] z-[100]"
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
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-black/[0.06] rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="w-px h-8 bg-black/[0.06] mx-1" />

        {/* Styling & Config */}
        <div className="flex items-center gap-1.5 px-2">
          {/* Palette (Color & Pen) */}
          <button 
            onClick={() => toggleConfig('style')}
            className={cn(
              "p-3.5 rounded-2xl transition-all",
              showConfig === 'style' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-black/[0.04]"
            )}
          >
            <Palette className="h-5 w-5" />
          </button>

          {/* Quick Actions (Save, Load, etc) */}
          <button 
            onClick={() => toggleConfig('actions')}
            className={cn(
              "p-3.5 rounded-2xl transition-all",
              showConfig === 'actions' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-black/[0.04]"
            )}
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>

        <div className="w-px h-8 bg-black/[0.06] mx-1" />

        {/* AI Magic Button */}
        <div className="px-2">
          <button 
            onClick={() => { onConvert(); setActiveGroup(null); setShowConfig(null); }}
            disabled={shapeCount === 0 || isConverting}
            className={cn(
              'flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all relative overflow-hidden group shadow-lg shadow-gray-900/10',
              shapeCount > 0 && !isConverting ? 'bg-gray-900 text-white hover:shadow-2xl hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Sparkles className={cn('h-4 w-4 relative z-10', isConverting && 'animate-spin')} />
            <span className="relative z-10 uppercase tracking-wider text-[11px]">{isConverting ? 'Processing' : 'Gen Tasks'}</span>
          </button>
        </div>
      </motion.div>

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
