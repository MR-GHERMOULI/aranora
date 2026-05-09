'use client';

import { useMemo } from 'react';
import type { NexusConnection, NexusShape, CanvasTheme } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { getConnectionPoints, getConnectionPath } from '@/lib/nexus/canvas-helpers';
import rough from 'roughjs';
import { Type, ArrowRight, Circle, Diamond, Minus, Navigation } from 'lucide-react';

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
  onSplitConn: (connId: string) => void;
  canvasTheme: CanvasTheme;
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
  onSelect, onDoubleClick, onUpdateConn, onLabelChange, onFinishEditing, onSplitConn,
  canvasTheme,
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

      {/* Connection line */}
      {canvasTheme === 'hand-drawn' && roughPaths ? (
        roughPaths.map(p => (
          <path
            key={p.key}
            d={p.d}
            stroke={isSelected ? '#3b82f6' : conn.color}
            fill="none"
            strokeWidth={isSelected ? conn.strokeWidth + 0.5 : conn.strokeWidth}
            strokeLinecap="round"
            markerStart={conn.startMarker !== 'none' && p.isFirst ? `url(#${conn.startMarker || 'dot'}-${conn.id})` : 'none'}
            markerEnd={conn.endMarker !== 'none' && p.isFirst ? `url(#${conn.endMarker || 'arrow'}-${conn.id})` : 'none'}
            style={{ pointerEvents: 'none' }}
          />
        ))
      ) : (
        <path
          d={pathData}
          stroke={isSelected ? '#3b82f6' : conn.color}
          fill="none"
          strokeWidth={isSelected ? conn.strokeWidth + 1 : conn.strokeWidth}
          markerStart={conn.startMarker !== 'none' ? `url(#${conn.startMarker || 'dot'}-${conn.id})` : 'none'}
          markerEnd={conn.endMarker !== 'none' ? `url(#${conn.endMarker || 'arrow'}-${conn.id})` : 'none'}
          style={{ pointerEvents: 'none' }}
          className={canvasTheme === 'flat' ? "transition-all duration-200" : ""}
        />
      )}

      {/* Label pill */}
      {(conn.label || isEditing) && (
        <foreignObject
          x={midX - 60} y={midY - 15}
          width={120} height={30}
          style={{ pointerEvents: isEditing ? 'all' : 'none' }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
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

      {/* Routing & Endpoint controls */}
      {isSelected && !isEditing && (
        <foreignObject
          x={midX - 160} y={midY + 20}
          width={320} height={40}
          style={{ pointerEvents: 'all' }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/5 divide-x divide-gray-100">
              
              {/* Text Label */}
              <div className="px-1 flex gap-0.5">
                <button
                  onClick={() => { onDoubleClick(conn.id); }}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-all"
                  title="Add Phrase"
                >
                  <Type className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { onSplitConn(conn.id); }}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-green-600 transition-all"
                  title="Branch from connection"
                >
                  <Navigation className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Start Marker */}
              <div className="px-1 flex gap-0.5">
                {[
                  { m: 'none', icon: Minus },
                  { m: 'dot', icon: Circle },
                  { m: 'diamond', icon: Diamond }
                ].map(opt => (
                  <button key={`start-${opt.m}`} onClick={() => onUpdateConn(conn.id, { startMarker: opt.m as any })}
                    className={cn("p-1.5 rounded-lg transition-all", (conn.startMarker === opt.m || (opt.m==='none' && !conn.startMarker)) ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50")}>
                    <opt.icon className="h-3 w-3" />
                  </button>
                ))}
              </div>

              {/* Routing */}
              <div className="px-1 flex gap-0.5">
                {[
                  { r: 'curved', label: 'Curved' },
                  { r: 'straight', label: 'Straight' },
                  { r: 'orthogonal', label: 'Ortho' }
                ].map(opt => (
                  <button key={`rout-${opt.r}`} onClick={() => onUpdateConn(conn.id, { routing: opt.r as any })}
                    className={cn("px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all", (conn.routing === opt.r || (opt.r==='curved' && !conn.routing)) ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50")}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* End Marker */}
              <div className="px-1 flex gap-0.5">
                {[
                  { m: 'none', icon: Minus },
                  { m: 'arrow', icon: ArrowRight }
                ].map(opt => (
                  <button key={`end-${opt.m}`} onClick={() => onUpdateConn(conn.id, { endMarker: opt.m as any })}
                    className={cn("p-1.5 rounded-lg transition-all", (conn.endMarker === opt.m || (opt.m==='arrow' && !conn.endMarker)) ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50")}>
                    <opt.icon className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
