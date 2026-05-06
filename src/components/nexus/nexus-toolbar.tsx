'use client';

import { cn } from '@/lib/utils';
import type { ToolMode } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS, CONNECTION_COLORS } from '@/types/nexus';
import {
  MousePointer2, Hand, Square, Circle, Diamond, Hexagon,
  Link2, Sparkles, Save, Trash2, Download, FolderOpen,
  Plus, Palette, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

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
  canvasName: string;
  onCanvasNameChange: (name: string) => void;
  shapeCount: number;
  connectionCount: number;
  isConverting: boolean;
}

const tools: { mode: ToolMode; icon: any; label: string; shortcut?: string }[] = [
  { mode: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { mode: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
  { mode: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { mode: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { mode: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D' },
  { mode: 'hexagon', icon: Hexagon, label: 'Hexagon', shortcut: 'X' },
  { mode: 'connect', icon: Link2, label: 'Connect', shortcut: 'L' },
];

export function NexusToolbar({
  activeTool, onToolChange, activeColor, onColorChange,
  connectionColor, onConnectionColorChange,
  onConvert, onSave, onClear, onNewCanvas, onLoadCanvas,
  canvasName, onCanvasNameChange, shapeCount, connectionCount, isConverting,
}: ToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showConnColors, setShowConnColors] = useState(false);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
      {/* Canvas name */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        <input
          value={canvasName}
          onChange={e => onCanvasNameChange(e.target.value)}
          className="bg-transparent text-white text-sm font-medium w-32 outline-none placeholder:text-zinc-500"
          placeholder="Untitled Canvas"
        />
        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
          {shapeCount}s · {connectionCount}c
        </span>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        {tools.map(t => (
          <button
            key={t.mode}
            onClick={() => onToolChange(t.mode)}
            title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 relative group',
              activeTool === t.mode
                ? 'bg-blue-500/20 text-blue-400 shadow-inner'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            )}
          >
            <t.icon className="h-4 w-4" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-zinc-300 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {t.label}{t.shortcut && <span className="ml-1 text-zinc-500">({t.shortcut})</span>}
            </span>
          </button>
        ))}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Shape Color Picker */}
        <div className="relative">
          <button
            onClick={() => { setShowColors(!showColors); setShowConnColors(false); }}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
            title="Shape Colors"
          >
            <div className="w-4 h-4 rounded-sm border border-white/20" style={{ background: activeColor.fill }} />
            <ChevronDown className="h-3 w-3" />
          </button>
          {showColors && (
            <div className="absolute top-full mt-2 left-0 p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl grid grid-cols-4 gap-2 w-56">
              <span className="col-span-4 text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Shape Colors</span>
              {SHAPE_COLOR_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { onColorChange(p.fill, p.border, p.text); setShowColors(false); }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-all',
                    activeColor.fill === p.fill && 'ring-1 ring-blue-400 bg-white/5'
                  )}
                >
                  <div className="w-6 h-6 rounded-md border-2" style={{ background: p.fill, borderColor: p.border }} />
                  <span className="text-[9px] text-zinc-400">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Connection Color Picker */}
        <div className="relative">
          <button
            onClick={() => { setShowConnColors(!showConnColors); setShowColors(false); }}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
            title="Connection Colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            <div className="w-3 h-3 rounded-full" style={{ background: connectionColor }} />
          </button>
          {showConnColors && (
            <div className="absolute top-full mt-2 right-0 p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 block">Link Color</span>
              <div className="flex gap-2 flex-wrap w-40">
                {CONNECTION_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { onConnectionColorChange(c); setShowConnColors(false); }}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                      connectionColor === c ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        <button onClick={onSave} className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Save Canvas">
          <Save className="h-4 w-4" />
        </button>
        <button onClick={onLoadCanvas} className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Load Canvas">
          <FolderOpen className="h-4 w-4" />
        </button>
        <button onClick={onNewCanvas} className="p-2 rounded-lg text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="New Canvas">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={onClear} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Clear Canvas">
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Convert Button */}
        <button
          onClick={onConvert}
          disabled={shapeCount === 0 || isConverting}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
            shapeCount > 0 && !isConverting
              ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          <Sparkles className={cn('h-4 w-4', isConverting && 'animate-spin')} />
          {isConverting ? 'Converting...' : 'Generate Tasks'}
        </button>
      </div>
    </div>
  );
}
