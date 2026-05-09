'use client';

import { cn } from '@/lib/utils';
import type { NexusShape, ShapeType } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import {
  Square, Circle, Diamond, Hexagon,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Languages, Hash, ArrowRightLeft, Type, Copy,
  GitBranch, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Network,
  Lock, Unlock, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ShapePropertiesProps {
  shape: NexusShape;
  onColorChange: (fill: string, border: string, text: string) => void;
  onTypeChange: (type: ShapeType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddChild: (direction: 'left' | 'right' | 'top' | 'bottom') => void;
  onFontSizeChange: (size: number) => void;
  onPropertyChange: (updates: Partial<NexusShape>) => void;
  onToggleLock: () => void;
  zoom: number;
  viewport: { x: number; y: number };
}

const shapeTypes: { type: ShapeType; icon: any; label: string }[] = [
  { type: 'rectangle', icon: Square, label: 'Box' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'diamond', icon: Diamond, label: 'Diamond' },
  { type: 'hexagon', icon: Hexagon, label: 'Hex' },
  { type: 'parallelogram', icon: Square, label: 'Para' },
  { type: 'text', icon: Type, label: 'Text' },
];

const symbols = ['[ ]', '{ }', '( )', '→', '•', '★', '✔', '✖', '●', '■', '▲'];

export function ShapeProperties({
  shape, onColorChange, onTypeChange, onDelete, onDuplicate, onAddChild, onFontSizeChange,
  onPropertyChange, onToggleLock, zoom, viewport
}: ShapePropertiesProps) {
  const [showSymbols, setShowSymbols] = useState(false);
  const [showColorGrid, setShowColorGrid] = useState(false);
  const [showMorph, setShowMorph] = useState(false);
  const [showTypography, setShowTypography] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showMore, setShowMore] = useState(false);
  
  const x = (shape.x * zoom) + viewport.x + (shape.width * zoom / 2);
  const y = (shape.y * zoom) + viewport.y - 100; // Raised to avoid rotation handle overlap

  const insertSymbol = (s: string) => {
    onPropertyChange({ text: (shape.text || '') + s });
  };

  const currentShapeType = shapeTypes.find(t => t.type === shape.type) || shapeTypes[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
      className="fixed z-[60] flex items-center p-1 rounded-[1.8rem] bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04]"
      style={{ left: x, top: Math.max(80, y) }}
    >
      {/* 1. Morph Dropdown */}
      {!shape.isLocked && (
        <div className="relative px-1 border-r border-black/[0.06]">
          <button
            onClick={() => setShowMorph(!showMorph)}
            className={cn(
              "flex items-center gap-1.5 p-2 rounded-2xl transition-all hover:bg-black/[0.04] text-gray-900",
              showMorph && "bg-black/[0.04]"
            )}
            title="Change Shape Type"
          >
            <currentShapeType.icon className="h-4 w-4" />
            <ChevronDown className={cn("h-3 w-3 text-gray-400 transition-transform", showMorph && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showMorph && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-0 p-2 rounded-2xl bg-white border border-black/[0.08] shadow-2xl z-[100] grid grid-cols-3 gap-1 min-w-[140px]"
              >
                {shapeTypes.map(t => (
                  <button
                    key={t.type}
                    onClick={() => { onTypeChange(t.type); setShowMorph(false); }}
                    className={cn(
                      "p-2.5 rounded-xl transition-all flex flex-col items-center gap-1",
                      shape.type === t.type ? "bg-gray-900 text-white shadow-md" : "text-gray-400 hover:bg-black/[0.04] hover:text-gray-900"
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="text-[8px] font-bold uppercase">{t.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. Style Group (Visible) */}
      {!shape.isLocked && (
        <div className="flex items-center gap-2 px-2 border-r border-black/[0.06] relative">
          <button
            onClick={() => setShowColorGrid(!showColorGrid)}
            className="w-7 h-7 rounded-full border border-black/10 ring-2 ring-white shadow-sm hover:scale-110 transition-transform flex items-center justify-center overflow-hidden"
            style={{ background: shape.color }}
          />

          <div className="flex items-center gap-1 bg-black/[0.03] p-1 rounded-2xl">
            <button
              onClick={() => setShowTypography(!showTypography)}
              className={cn(
                "flex items-center gap-1 p-1.5 px-2 rounded-xl transition-all hover:bg-white hover:shadow-sm text-gray-600",
                showTypography && "bg-white shadow-sm"
              )}
              title="Text Settings"
            >
              <span className="text-[10px] font-black uppercase">Text</span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
          </div>

          <AnimatePresence>
            {showTypography && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-0 p-3 rounded-[2rem] bg-white border border-black/[0.08] shadow-2xl z-[100] min-w-[200px] space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-black/[0.04] pb-2">
                  <button
                    onClick={() => onPropertyChange({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={cn("p-2 rounded-xl transition-all", shape.fontWeight === 'bold' ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-400 hover:bg-black/[0.04]")}
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <div className="flex bg-black/[0.03] p-0.5 rounded-xl">
                    {[{ align: 'left', icon: AlignLeft }, { align: 'center', icon: AlignCenter }, { align: 'right', icon: AlignRight }].map(a => (
                      <button
                        key={a.align}
                        onClick={() => onPropertyChange({ textAlign: a.align as any })}
                        className={cn("p-1.5 rounded-lg transition-all", (shape.textAlign === a.align || (!shape.textAlign && a.align === 'center')) ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}
                      >
                        <a.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={shape.fontFamily || 'sans'}
                    onChange={e => onPropertyChange({ fontFamily: e.target.value as any })}
                    className="flex-1 bg-black/[0.04] text-[10px] font-bold text-gray-700 py-1.5 px-2 rounded-xl outline-none"
                  >
                    <option value="sans">Sans</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Mono</option>
                  </select>
                  <select
                    value={shape.fontSize || 14}
                    onChange={e => onFontSizeChange(Number(e.target.value))}
                    className="w-16 bg-black/[0.04] text-[10px] font-bold text-gray-700 py-1.5 px-2 rounded-xl outline-none"
                  >
                    {[12, 14, 16, 20, 24, 32].map(size => <option key={size} value={size}>{size}px</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPropertyChange({ direction: shape.direction === 'rtl' ? 'ltr' : 'rtl', textAlign: shape.direction === 'rtl' ? 'center' : 'right' })}
                    className={cn("flex-1 p-2 rounded-xl transition-all text-[10px] font-black", shape.direction === 'rtl' ? "bg-blue-50 text-blue-600" : "bg-black/[0.04] text-gray-400")}
                  >
                    RTL MODE
                  </button>
                  <button
                    onClick={() => setShowSymbols(!showSymbols)}
                    className={cn("p-2 rounded-xl transition-all", showSymbols ? "bg-amber-50 text-amber-600" : "bg-black/[0.04] text-gray-400")}
                  >
                    <Hash className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showColorGrid && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-0 p-4 rounded-[2rem] bg-white border border-black/[0.08] shadow-2xl z-[100] w-64"
              >
                <div className="grid grid-cols-6 gap-2">
                  {SHAPE_COLOR_PRESETS.slice(0, 18).map(p => (
                    <button
                      key={p.name}
                      onClick={() => { onColorChange(p.fill, p.border, p.text); setShowColorGrid(false); }}
                      className={cn("w-7 h-7 rounded-full border border-black/5 transition-all hover:scale-125 ring-offset-4 ring-gray-900", shape.color === p.fill ? "ring-2" : "")}
                      style={{ background: p.fill }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Expansion Dropdown (MindMap) */}
      {!shape.isLocked && (
        <div className="relative px-1 border-r border-black/[0.06]">
          <button
            onClick={() => setShowMindMap(!showMindMap)}
            className={cn(
              "flex items-center gap-1.5 p-2 rounded-2xl transition-all hover:bg-blue-50 text-blue-500",
              showMindMap && "bg-blue-50"
            )}
            title="Expand Branches"
          >
            <GitBranch className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>

          <AnimatePresence>
            {showMindMap && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-2 rounded-[1.5rem] bg-white border border-black/[0.08] shadow-2xl z-[100] flex gap-1"
              >
                {[
                  { dir: 'top', icon: ArrowUp },
                  { dir: 'bottom', icon: ArrowDown },
                  { dir: 'left', icon: ArrowLeft },
                  { dir: 'right', icon: ArrowRight },
                ].map(d => (
                  <button
                    key={d.dir}
                    onClick={() => { onAddChild(d.dir as any); setShowMindMap(false); }}
                    className="p-3 rounded-xl text-blue-600 hover:bg-blue-50 transition-all active:scale-90 flex flex-col items-center gap-1"
                  >
                    <d.icon className="h-4 w-4" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Core Actions */}
      <div className="flex items-center gap-0.5 px-1.5">
        <button
          onClick={onToggleLock}
          className={cn(
            "p-2.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center",
            shape.isLocked 
              ? "bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-red-600" 
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          )}
          title={shape.isLocked ? "Unlock Item" : "Lock Item"}
        >
          {shape.isLocked ? <Lock className="h-4.5 w-4.5" /> : <Unlock className="h-4 w-4" />}
        </button>
        
        {!shape.isLocked && (
          <>
            <button
              onClick={onDuplicate}
              className="p-2.5 rounded-2xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-2xl text-red-400/60 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showSymbols && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-20 left-1/2 -translate-x-1/2 p-3 rounded-2xl bg-white border border-black/[0.08] shadow-2xl grid grid-cols-4 gap-1 z-[101]"
          >
            {symbols.map(s => (
              <button key={s} onClick={() => { insertSymbol(s); setShowSymbols(false); }} className="p-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-all">{s}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-black/[0.08] rotate-45" />
    </motion.div>
  );
}
