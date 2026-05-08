'use client';

import { useMemo } from 'react';
import type { NexusConnection, NexusShape } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { getConnectionPoints, getConnectionPath } from '@/lib/nexus/canvas-helpers';
import rough from 'roughjs';

const roughGenerator = typeof window !== 'undefined' ? rough.generator() : null;

interface ConnectionLineProps {
  conn: NexusConnection;
  shapes: NexusShape[];
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (e: React.MouseEvent, connId: string) => void;
  onDoubleClick: (connId: string) => void;
  onUpdateConn: (connId: string, updates: Partial<NexusConnection>) => void;
  onLabelChange: (connId: string, label: string) => void;
  onFinishEditing: () => void;
}

/**
 * ConnectionLine — renders a single connection between two shapes.
 * 
 * Extracted as its own component so that `useMemo` is called at the
 * component top-level (valid) rather than inside a `.map()` loop
 * (Rules of Hooks violation that caused runtime crashes).
 */
export function ConnectionLine({
  conn, shapes, isSelected, isEditing,
  onSelect, onDoubleClick, onUpdateConn, onLabelChange, onFinishEditing,
}: ConnectionLineProps) {
  const from = shapes.find(s => s.id === conn.fromShapeId);
  const to = shapes.find(s => s.id === conn.toShapeId);

  const pts = from && to ? getConnectionPoints(from, to) : null;
  const pathData = pts
    ? getConnectionPath(pts.x1, pts.y1, pts.x2, pts.y2, conn.routing)
    : null;

  // ── Rough.js hand-drawn path (now a legal top-level hook) ──
  const roughPaths = useMemo(() => {
    if (!roughGenerator || !pathData) return null;
    try {
      const drawable = roughGenerator.path(pathData, {
        stroke: isSelected ? '#3b82f6' : conn.color,
        strokeWidth: isSelected ? conn.strokeWidth + 0.5 : conn.strokeWidth,
        roughness: 0.8,
        bowing: 1.2,
        seed: 1,
      });
      return roughGenerator.toPaths(drawable).map((p, i) => ({
        d: p.d,
        key: `line-${i}`,
        isFirst: i === 0,
      }));
    } catch {
      return null; // fallback rendered below
    }
  }, [pathData, isSelected, conn.color, conn.strokeWidth]);

  if (!from || !to || !pts || !pathData) return null;

  const midX = (pts.x1 + pts.x2) / 2;
  const midY = (pts.y1 + pts.y2) / 2;

  return (
    <g onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(conn.id); }}>
      {/* Invisible wide hit area */}
      <path
        d={pathData}
        stroke="transparent" strokeWidth={24} fill="none"
        style={{ cursor: 'pointer' }}
        onClick={e => onSelect(e, conn.id)}
      />

      {/* Selection glow */}
      {isSelected && (
        <path
          d={pathData}
          stroke="#3b82f6" strokeWidth={conn.strokeWidth + 8} fill="none"
          strokeOpacity={0.2}
          style={{ pointerEvents: 'none' }}
          className="transition-all duration-300"
        />
      )}

      {/* Hand-drawn line (or fallback) */}
      {roughPaths ? roughPaths.map(p => (
        <path
          key={p.key}
          d={p.d}
          stroke={isSelected ? '#3b82f6' : conn.color}
          fill="none"
          strokeWidth={isSelected ? conn.strokeWidth + 0.5 : conn.strokeWidth}
          strokeLinecap="round"
          markerStart={p.isFirst ? `url(#dot-${conn.id})` : 'none'}
          markerEnd={p.isFirst ? `url(#arrow-${conn.id})` : 'none'}
          style={{ pointerEvents: 'none' }}
        />
      )) : (
        <path
          d={pathData}
          stroke={isSelected ? '#3b82f6' : conn.color}
          fill="none"
          strokeWidth={isSelected ? conn.strokeWidth + 1 : conn.strokeWidth}
          markerStart={`url(#dot-${conn.id})`}
          markerEnd={`url(#arrow-${conn.id})`}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Label pill */}
      {(conn.label || isEditing) && (
        <foreignObject
          x={midX - 60} y={midY - 15}
          width={120} height={30}
          style={{ pointerEvents: isEditing ? 'all' : 'none' }}
        >
          <div className="flex items-center justify-center h-full">
            {isEditing ? (
              <input
                autoFocus
                value={conn.label || ''}
                onChange={(e) => onLabelChange(conn.id, e.target.value)}
                onBlur={onFinishEditing}
                onKeyDown={(e) => { if (e.key === 'Enter') onFinishEditing(); }}
                className="w-28 px-3 py-1 bg-white/90 backdrop-blur border-2 border-blue-500 rounded-xl text-[11px] font-bold text-center shadow-2xl outline-none"
                placeholder="Label..."
              />
            ) : (
              <div className={cn(
                "px-3 py-1 bg-white border rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap transition-all",
                isSelected ? "border-blue-500 text-blue-600 scale-110 shadow-md" : "border-gray-200 text-gray-700"
              )}>
                {conn.label}
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* Routing controls */}
      {isSelected && !isEditing && (
        <foreignObject
          x={midX - 75} y={midY + 20}
          width={150} height={40}
          style={{ pointerEvents: 'all' }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/5">
              <button
                onClick={() => onUpdateConn(conn.id, { routing: 'curved' })}
                className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                  (!conn.routing || conn.routing === 'curved') ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50")}
              >
                Free
              </button>
              <button
                onClick={() => onUpdateConn(conn.id, { routing: 'orthogonal' })}
                className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                  conn.routing === 'orthogonal' ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50")}
              >
                Regulated
              </button>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
