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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[520px] max-h-[70vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-gray-900 font-bold text-xl">Your Canvases</h2>
            <p className="text-gray-500 text-xs mt-0.5 font-medium">{canvases.length} saved canvas{canvases.length !== 1 ? 'es' : ''}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gray-50/30">
          {canvases.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 border border-gray-200/50">
                <Shapes className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold">No saved canvases yet</p>
              <p className="text-gray-400 text-xs mt-1">Start drawing and save your first professional draft!</p>
            </div>
          ) : (
            canvases.map(c => (
              <div
                key={c.id}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer relative"
                onClick={() => onSelect(c)}
              >
                {/* Icon */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shrink-0">
                  <Shapes className="h-5 w-5 text-blue-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{c.name || 'Untitled Canvas'}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                       {c.shapes.length} shapes
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       {c.connections.length} links
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-100 shadow-sm"
                  title="Delete canvas"
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
