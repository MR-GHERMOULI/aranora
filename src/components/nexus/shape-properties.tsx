'use client';

import { cn } from '@/lib/utils';
import type { NexusShape, ShapeType } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import {
  Square, Circle, Diamond, Hexagon,
  Trash2, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Baseline, Languages, Hash, ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ShapePropertiesProps {
  shape: NexusShape;
  onColorChange: (fill: string, border: string, text: string) => void;
  onTypeChange: (type: ShapeType) => void;
  onDelete: () => void;
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
];

const symbols = ['[ ]', '{ }', '( )', '→', '•', '★', '✔', '✖', '●', '■', '▲'];

export function ShapeProperties({
  shape, onColorChange, onTypeChange, onDelete, onFontSizeChange,
  onPropertyChange, zoom, viewport
}: ShapePropertiesProps) {
  const [showSymbols, setShowSymbols] = useState(false);
  
  const x = (shape.x * zoom) + viewport.x;
  const y = (shape.y * zoom) + viewport.y - 72;

  const insertSymbol = (s: string) => {
    onPropertyChange({ text: (shape.text || '') + s });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed z-[60] flex items-center gap-1 p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl ring-1 ring-black/5"
      style={{ left: x, top: Math.max(80, y) }}
    >
      {/* Type Switcher */}
      <div className="flex items-center gap-0.5 px-1 border-r border-gray-100">
        {shapeTypes.map(t => (
          <button
            key={t.type}
            onClick={() => onTypeChange(t.type)}
            className={cn(
              "p-2 rounded-lg transition-all",
              shape.type === t.type ? "bg-gray-100 text-blue-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Formatting & Direction */}
      <div className="flex items-center gap-0.5 px-1 border-r border-gray-100">
        <button
          onClick={() => onPropertyChange({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={cn("p-2 rounded-lg transition-all", shape.fontWeight === 'bold' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50")}
        >
          <Bold className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => onPropertyChange({ direction: shape.direction === 'rtl' ? 'ltr' : 'rtl', textAlign: shape.direction === 'rtl' ? 'center' : 'right' })}
          className={cn("p-2 rounded-lg transition-all flex items-center gap-1", shape.direction === 'rtl' ? "bg-gray-100 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
          title="Toggle RTL"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span className="text-[9px] font-bold">RTL</span>
        </button>
        
        <div className="w-px h-4 bg-gray-100 mx-1" />

        <button
          onClick={() => onPropertyChange({ textAlign: 'left' })}
          className={cn("p-2 rounded-lg transition-all", shape.textAlign === 'left' ? "bg-gray-100 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPropertyChange({ textAlign: 'center' })}
          className={cn("p-2 rounded-lg transition-all", shape.textAlign === 'center' || !shape.textAlign ? "bg-gray-100 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPropertyChange({ textAlign: 'right' })}
          className={cn("p-2 rounded-lg transition-all", shape.textAlign === 'right' ? "bg-gray-100 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
        >
          <AlignRight className="h-4 w-4" />
        </button>
      </div>

      {/* Symbols & Fonts */}
      <div className="flex items-center gap-1.5 px-2 border-r border-gray-100 relative">
        <button
          onClick={() => setShowSymbols(!showSymbols)}
          className={cn("p-2 rounded-lg transition-all", showSymbols ? "bg-gray-100 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
          title="Insert Symbol"
        >
          <Hash className="h-4 w-4" />
        </button>
        
        <AnimatePresence>
          {showSymbols && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute bottom-[calc(100%+12px)] left-0 p-2 rounded-xl bg-white border border-gray-200 shadow-xl grid grid-cols-4 gap-1 min-w-[120px]"
            >
              {symbols.map(s => (
                <button
                  key={s}
                  onClick={() => { insertSymbol(s); setShowSymbols(false); }}
                  className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-all border border-transparent hover:border-blue-100"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <select
          value={shape.fontFamily || 'sans'}
          onChange={e => onPropertyChange({ fontFamily: e.target.value as any })}
          className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer hover:text-blue-600 ml-1"
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1.5 px-2 border-r border-gray-100">
        <div className="grid grid-cols-6 gap-1">
          {SHAPE_COLOR_PRESETS.slice(0, 12).map(p => (
            <button
              key={p.name}
              onClick={() => onColorChange(p.fill, p.border, p.text)}
              className={cn(
                "w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-125",
                shape.color === p.fill ? "ring-2 ring-blue-500 ring-offset-2 scale-110" : ""
              )}
              title={p.name}
              style={{ background: p.fill }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-1">
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Arrow pointing down */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45" />
    </motion.div>
  );
}
