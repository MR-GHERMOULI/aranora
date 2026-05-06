'use client';

import { cn } from '@/lib/utils';
import type { NexusShape, ShapeType } from '@/types/nexus';
import { SHAPE_COLOR_PRESETS } from '@/types/nexus';
import {
  Square, Circle, Diamond, Hexagon,
  Trash2, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Baseline
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export function ShapeProperties({
  shape, onColorChange, onTypeChange, onDelete, onFontSizeChange,
  onPropertyChange, zoom, viewport
}: ShapePropertiesProps) {
  const x = (shape.x * zoom) + viewport.x;
  const y = (shape.y * zoom) + viewport.y - 72; // Increased offset from 64 to 72 for better clearance

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

      {/* Font & Formatting */}
      <div className="flex items-center gap-0.5 px-1 border-r border-gray-100">
        <button
          onClick={() => onPropertyChange({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={cn(
            "p-2 rounded-lg transition-all",
            shape.fontWeight === 'bold' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50"
          )}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPropertyChange({ fontStyle: shape.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className={cn(
            "p-2 rounded-lg transition-all",
            shape.fontStyle === 'italic' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50"
          )}
        >
          <Italic className="h-4 w-4" />
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

      {/* Font Family & Size */}
      <div className="flex items-center gap-2 px-2 border-r border-gray-100">
        <Baseline className="h-3.5 w-3.5 text-gray-400" />
        <select
          value={shape.fontFamily || 'sans'}
          onChange={e => onPropertyChange({ fontFamily: e.target.value as any })}
          className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer hover:text-blue-600"
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
        <div className="w-px h-4 bg-gray-100 mx-1" />
        <select
          value={shape.fontSize}
          onChange={e => onFontSizeChange(Number(e.target.value))}
          className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer hover:text-blue-600"
        >
          {[12, 14, 16, 18, 20, 24, 32].map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
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
