'use client';

import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';

interface CursorProps {
  name: string;
  color: string;
  x: number;
  y: number;
}

export function CollaborativeCursor({ name, color, x, y }: CursorProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-[100]"
      initial={false}
      animate={{ x, y }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
    >
      <MousePointer2 
        className="w-5 h-5" 
        style={{ color, fill: color, strokeWidth: 3 }} 
      />
      <motion.div
        className="ml-4 px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-xl flex items-center gap-1.5 whitespace-nowrap"
        style={{ backgroundColor: color }}
        initial={{ opacity: 0, scale: 0.8, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
        {name}
      </motion.div>
    </motion.div>
  );
}

export function CollaborativeCursors() {
  // Mock data for demo purposes, as seen in the user's sample
  const cursors = [
    { id: '1', name: 'Miriam', color: '#f97316', x: 450, y: 320 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursors.map(c => (
        <CollaborativeCursor key={c.id} {...c} />
      ))}
    </div>
  );
}
