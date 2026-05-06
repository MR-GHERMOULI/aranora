'use client';

import type { NexusCanvas as NexusCanvasData } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { X, Trash2, Clock, Shapes } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CanvasListProps {
  canvases: NexusCanvasData[];
  onSelect: (canvas: NexusCanvasData) => void;
  onDelete: (canvasId: string) => void;
  onClose: () => void;
}

export function CanvasList({ canvases, onSelect, onDelete, onClose }: CanvasListProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] max-h-[70vh] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold text-lg">Your Canvases</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{canvases.length} saved canvas{canvases.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {canvases.length === 0 ? (
            <div className="text-center py-12">
              <Shapes className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No saved canvases yet</p>
              <p className="text-zinc-600 text-xs mt-1">Start drawing and save your first canvas!</p>
            </div>
          ) : (
            canvases.map(c => (
              <div
                key={c.id}
                className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer"
                onClick={() => onSelect(c)}
              >
                {/* Icon */}
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/10 shrink-0">
                  <Shapes className="h-5 w-5 text-violet-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{c.name || 'Untitled Canvas'}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                    <span>{c.shapes.length} shapes</span>
                    <span>·</span>
                    <span>{c.connections.length} connections</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
