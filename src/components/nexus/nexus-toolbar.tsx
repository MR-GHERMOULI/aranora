'use client';

import { cn } from '@/lib/utils';
import type { ToolMode } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS, CONNECTION_COLORS } from '@/types/nexus';
import {
  MousePointer2, Hand, Square, Circle, Diamond, Hexagon,
  Link2, Sparkles, Save, Trash2, FolderOpen, Plus, ChevronDown,
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
  connectFrom: string | null;
}

const tools: { mode: ToolMode; icon: any; label: string; shortcut: string }[] = [
  { mode: 'select',      icon: MousePointer2, label: 'Select',      shortcut: 'V' },
  { mode: 'pan',         icon: Hand,          label: 'Pan',         shortcut: 'H' },
  { mode: 'rectangle',   icon: Square,        label: 'Rectangle',   shortcut: 'R' },
  { mode: 'circle',      icon: Circle,        label: 'Circle',      shortcut: 'C' },
  { mode: 'diamond',     icon: Diamond,       label: 'Diamond',     shortcut: 'D' },
  { mode: 'hexagon',     icon: Hexagon,       label: 'Hexagon',     shortcut: 'X' },
  { mode: 'connect',     icon: Link2,         label: 'Connect',     shortcut: 'L' },
];

export function NexusToolbar({
  activeTool, onToolChange, activeColor, onColorChange,
  connectionColor, onConnectionColorChange,
  onConvert, onSave, onClear, onNewCanvas, onLoadCanvas,
  canvasName, onCanvasNameChange, shapeCount, connectionCount,
  isConverting, connectFrom,
}: ToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showConnColors, setShowConnColors] = useState(false);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">

      {/* Canvas name */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-md">
        <input
          value={canvasName}
          onChange={e => onCanvasNameChange(e.target.value)}
          className="bg-transparent text-gray-800 text-sm font-semibold w-36 outline-none placeholder:text-gray-400"
          placeholder="Untitled Canvas"
        />
        <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">
          {shapeCount}s · {connectionCount}c
        </span>
      </div>

      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-white border border-gray-200 shadow-md">
        {tools.map(t => (
          <button
            key={t.mode}
            onClick={() => onToolChange(t.mode)}
            title={`${t.label} (${t.shortcut})`}
            className={cn(
              'p-2 rounded-lg transition-all duration-150 relative group',
              activeTool === t.mode && t.mode !== 'connect'
                ? 'bg-blue-50 text-blue-600 shadow-inner ring-1 ring-blue-200'
                : activeTool === t.mode && t.mode === 'connect'
                ? connectFrom
                  ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-300'
                  : 'bg-violet-50 text-violet-600 ring-1 ring-violet-200'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <t.icon className="h-4 w-4" />
            <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-[10px] bg-gray-900 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
              {t.label} <span className="text-gray-400">({t.shortcut})</span>
            </span>
          </button>
        ))}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Shape color picker */}
        <div className="relative">
          <button
            onClick={() => { setShowColors(!showColors); setShowConnColors(false); }}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-1.5"
            title="Shape Color"
          >
            <div className="w-4 h-4 rounded border border-gray-300 shadow-inner" style={{ background: activeColor.fill }} />
            <ChevronDown className="h-3 w-3" />
          </button>
          {showColors && (
            <div className="absolute top-full mt-2 left-0 p-3 rounded-xl bg-white border border-gray-200 shadow-xl grid grid-cols-4 gap-1.5 w-56 z-50">
              <span className="col-span-4 text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Shape Color</span>
              {SHAPE_COLOR_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { onColorChange(p.fill, p.border, p.text); setShowColors(false); }}
                  title={p.name}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-gray-50 transition-all',
                    activeColor.fill === p.fill ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                  )}
                >
                  <div className="w-6 h-6 rounded-md border-2 shadow-sm" style={{ background: p.fill, borderColor: p.border }} />
                  <span className="text-[9px] text-gray-500">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Connection color picker */}
        <div className="relative">
          <button
            onClick={() => { setShowConnColors(!showConnColors); setShowColors(false); }}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-1.5"
            title="Link Color"
          >
            <Link2 className="h-3.5 w-3.5" />
            <div className="w-3 h-3 rounded-full border border-white shadow" style={{ background: connectionColor }} />
          </button>
          {showConnColors && (
            <div className="absolute top-full mt-2 right-0 p-3 rounded-xl bg-white border border-gray-200 shadow-xl z-50">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 block">Link Color</span>
              <div className="flex gap-2 flex-wrap w-44">
                {CONNECTION_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { onConnectionColorChange(c); setShowConnColors(false); }}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                      connectionColor === c ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-300'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-white border border-gray-200 shadow-md">
        <button onClick={onSave} className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Save Canvas (Ctrl+S)">
          <Save className="h-4 w-4" />
        </button>
        <button onClick={onLoadCanvas} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Load Canvas">
          <FolderOpen className="h-4 w-4" />
        </button>
        <button onClick={onNewCanvas} className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="New Canvas">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={onClear} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Clear Canvas">
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Generate Tasks */}
        <button
          onClick={onConvert}
          disabled={shapeCount === 0 || isConverting}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all',
            shapeCount > 0 && !isConverting
              ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-md shadow-violet-200 hover:shadow-violet-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <Sparkles className={cn('h-4 w-4', isConverting && 'animate-spin')} />
          {isConverting ? 'Generating…' : 'Generate Tasks'}
        </button>
      </div>
    </div>
  );
}
