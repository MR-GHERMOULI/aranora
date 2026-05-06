'use client';

import { cn } from '@/lib/utils';
import type { ToolMode } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS, CONNECTION_COLORS } from '@/types/nexus';
import {
  MousePointer2, Hand, Square, Circle, Diamond, Hexagon,
  Link2, Sparkles, Save, Trash2, FolderOpen, Plus, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
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
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4"
    >
      {/* Document Meta (Top of dock) */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <input
          value={canvasName}
          onChange={e => onCanvasNameChange(e.target.value)}
          className="bg-transparent text-gray-800 text-sm font-semibold w-40 outline-none placeholder:text-gray-400 focus:text-blue-600 transition-colors"
          placeholder="Untitled Canvas"
        />
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
          {shapeCount} Shapes <span className="mx-1">•</span> {connectionCount} Links
        </span>
      </div>

      {/* Main Dock */}
      <div className="flex items-center p-2 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.03)] ring-1 ring-gray-100">
        
        {/* Tools Section */}
        <div className="flex items-center gap-1 px-2">
          {tools.map(t => (
            <div key={t.mode} className="relative group">
              <button
                onClick={() => onToolChange(t.mode)}
                className={cn(
                  'relative p-3 rounded-xl transition-all duration-200',
                  activeTool === t.mode && t.mode !== 'connect'
                    ? 'text-blue-600 bg-blue-50/80 shadow-sm'
                    : activeTool === t.mode && t.mode === 'connect'
                    ? connectFrom
                      ? 'text-amber-600 bg-amber-50 shadow-sm'
                      : 'text-violet-600 bg-violet-50 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                )}
              >
                <t.icon className="h-5 w-5" />
              </button>
              
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl whitespace-nowrap">
                  {t.label} <kbd className="text-[10px] text-gray-400 font-mono bg-white/10 px-1.5 py-0.5 rounded">{t.shortcut}</kbd>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-px h-8 bg-gray-200 mx-2" />

        {/* Color Pickers */}
        <div className="flex items-center gap-1 px-2">
          {/* Shape Color */}
          <div className="relative">
            <button
              onClick={() => { setShowColors(!showColors); setShowConnColors(false); }}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                showColors ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              <div className="w-5 h-5 rounded-md shadow-sm border border-black/10 ring-2 ring-white" style={{ background: activeColor.fill }} />
              <ChevronUp className="h-3 w-3 opacity-50" />
            </button>

            <AnimatePresence>
              {showColors && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xl grid grid-cols-4 gap-2 w-64 z-50 origin-bottom"
                >
                  <span className="col-span-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Shape Style</span>
                  {SHAPE_COLOR_PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => { onColorChange(p.fill, p.border, p.text); setShowColors(false); }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-2 rounded-xl transition-all',
                        activeColor.fill === p.fill ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg shadow-sm border border-black/10" style={{ background: p.fill, borderColor: p.border }} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Connection Color */}
          <div className="relative">
            <button
              onClick={() => { setShowConnColors(!showConnColors); setShowColors(false); }}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                showConnColors ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              <Link2 className="h-4 w-4" />
              <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white border border-black/10" style={{ background: connectionColor }} />
            </button>
            <AnimatePresence>
              {showConnColors && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xl z-50 origin-bottom"
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3 block">Link Color</span>
                  <div className="flex gap-3 flex-wrap w-48 justify-center">
                    {CONNECTION_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { onConnectionColorChange(c); setShowConnColors(false); }}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          connectionColor === c ? 'border-gray-900 scale-110 shadow-md' : 'border-white hover:scale-110 hover:shadow-sm ring-1 ring-black/10'
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-200 mx-2" />

        {/* Actions Section */}
        <div className="flex items-center gap-1 px-2">
          <button onClick={onSave} className="p-3 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all group relative">
            <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={onLoadCanvas} className="p-3 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all group relative">
            <FolderOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={onNewCanvas} className="p-3 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all group relative">
            <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={onClear} className="p-3 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all group relative">
            <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="ml-2 pr-2 pl-4 py-1 border-l border-gray-200">
          <button
            onClick={onConvert}
            disabled={shapeCount === 0 || isConverting}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all overflow-hidden relative group',
              shapeCount > 0 && !isConverting
                ? 'bg-gray-900 text-white hover:bg-black hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {/* Shimmer effect */}
            {shapeCount > 0 && !isConverting && (
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
            )}
            <Sparkles className={cn('h-4 w-4 relative z-10', isConverting && 'animate-spin')} />
            <span className="relative z-10">{isConverting ? 'Analyzing...' : 'Generate Tasks'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
