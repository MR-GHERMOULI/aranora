'use client';

import { cn } from '@/lib/utils';
import type { NexusShape, ShapeType } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import {
  Square, Circle, Diamond, Hexagon,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Languages, Hash, ArrowRightLeft, Type, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ShapePropertiesProps {
  shape: NexusShape;
  onColorChange: (fill: string, border: string, text: string) => void;
  onTypeChange: (type: ShapeType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onFontSizeChange: (size: number) => void;
  onPropertyChange: (updates: Partial<NexusShape>) => void;
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
  shape, onColorChange, onTypeChange, onDelete, onDuplicate, onFontSizeChange,
  onPropertyChange, zoom, viewport
}: ShapePropertiesProps) {
  const [showSymbols, setShowSymbols] = useState(false);
  const [showColorGrid, setShowColorGrid] = useState(false);
  
  const x = (shape.x * zoom) + viewport.x + (shape.width * zoom / 2);
  const y = (shape.y * zoom) + viewport.y - 72;

  const insertSymbol = (s: string) => {
    onPropertyChange({ text: (shape.text || '') + s });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
      className="fixed z-[60] flex items-center p-1.5 rounded-[2rem] bg-white/95 backdrop-blur-2xl border border-black/[0.06] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.02]"
      style={{ left: x, top: Math.max(80, y) }}
    >
      {/* Group 1: Morphing */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-black/[0.04]">
        {shapeTypes.map(t => (
          <button
            key={t.type}
            onClick={() => onTypeChange(t.type)}
            className={cn(
              "p-2.5 rounded-2xl transition-all",
              shape.type === t.type ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20" : "text-gray-400 hover:bg-black/[0.04] hover:text-gray-900"
            )}
            title={t.label}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Group 2: Typography */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-black/[0.04]">
        <button
          onClick={() => onPropertyChange({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={cn("p-2.5 rounded-2xl transition-all", shape.fontWeight === 'bold' ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-400 hover:bg-black/[0.04]")}
        >
          <Bold className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => onPropertyChange({ direction: shape.direction === 'rtl' ? 'ltr' : 'rtl', textAlign: shape.direction === 'rtl' ? 'center' : 'right' })}
          className={cn("p-2.5 rounded-2xl transition-all flex items-center gap-1", shape.direction === 'rtl' ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-black/[0.04]")}
          title="Toggle RTL"
        >
          <span className="text-[10px] font-black leading-none">RTL</span>
        </button>
        
        <div className="w-px h-5 bg-black/[0.04] mx-1" />

        <div className="flex bg-black/[0.03] p-0.5 rounded-2xl">
          {[
            { align: 'left', icon: AlignLeft },
            { align: 'center', icon: AlignCenter },
            { align: 'right', icon: AlignRight }
          ].map(a => (
            <button
              key={a.align}
              onClick={() => onPropertyChange({ textAlign: a.align as any })}
              className={cn(
                "p-2 rounded-xl transition-all",
                (shape.textAlign === a.align || (!shape.textAlign && a.align === 'center')) ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <a.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Group 3: Styling & Symbols */}
      <div className="flex items-center gap-2 px-1.5 border-r border-black/[0.04] relative">
        <button
          onClick={() => setShowColorGrid(!showColorGrid)}
          className={cn("p-2 rounded-2xl transition-all border border-black/10 ring-2 ring-white shadow-sm hover:scale-110")}
          style={{ background: shape.color }}
        />

        <button
          onClick={() => setShowSymbols(!showSymbols)}
          className={cn("p-2.5 rounded-2xl transition-all", showSymbols ? "bg-amber-50 text-amber-600" : "text-gray-400 hover:bg-black/[0.04]")}
          title="Insert Symbol"
        >
          <Hash className="h-4 w-4" />
        </button>

        <select
          value={shape.fontFamily || 'sans'}
          onChange={e => onPropertyChange({ fontFamily: e.target.value as any })}
          className="bg-black/[0.04] text-[10px] font-bold text-gray-700 outline-none cursor-pointer hover:bg-black/[0.06] py-1.5 px-2.5 rounded-xl transition-all"
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>

        <select
          value={shape.fontSize || 14}
          onChange={e => onFontSizeChange(Number(e.target.value))}
          className="bg-black/[0.04] text-[10px] font-bold text-gray-700 outline-none cursor-pointer hover:bg-black/[0.06] py-1.5 px-2.5 rounded-xl transition-all"
        >
          {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>

        {/* Color Grid Flyout */}
        <AnimatePresence>
          {showColorGrid && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-4 left-0 p-4 rounded-[2rem] bg-white border border-black/[0.06] shadow-2xl z-[100] w-64"
            >
              <div className="px-2 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                {shape.type === 'text' ? 'Text Color' : 'Shape Color Card'}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SHAPE_COLOR_PRESETS.slice(0, 18).map(p => (
                  <button
                    key={p.name}
                    onClick={() => { onColorChange(p.fill, p.border, p.text); setShowColorGrid(false); }}
                    className={cn(
                      "w-7 h-7 rounded-full border border-black/5 transition-all hover:scale-125 ring-offset-4 ring-gray-900",
                      shape.color === p.fill ? "ring-2" : ""
                    )}
                    title={p.name}
                    style={{ background: p.fill }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Symbols Flyout */}
        <AnimatePresence>
          {showSymbols && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute bottom-full mb-4 left-0 p-3 rounded-[1.5rem] bg-white border border-black/[0.06] shadow-2xl grid grid-cols-4 gap-1 min-w-[140px] z-[100]"
            >
              {symbols.map(s => (
                <button
                  key={s}
                  onClick={() => { insertSymbol(s); setShowSymbols(false); }}
                  className="p-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-all"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Group 4: Actions */}
      <div className="flex items-center gap-0.5 px-1.5">
        <button
          onClick={onDuplicate}
          className="p-2.5 rounded-2xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2.5 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Arrow pointing down */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-black/[0.06] rotate-45" />
    </motion.div>
  );
}
