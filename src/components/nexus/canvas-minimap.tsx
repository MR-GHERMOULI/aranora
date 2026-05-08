'use client';

import { useMemo } from 'react';
import type { NexusShape, CanvasViewport } from '@/types/nexus';

interface MinimapProps {
  shapes: NexusShape[];
  viewport: CanvasViewport;
  containerWidth: number;
  containerHeight: number;
  onNavigate: (x: number, y: number) => void;
}

/**
 * CanvasMinimap — real-time bird's-eye navigator for large canvases.
 * Shows proportional shape positions + viewport rectangle.
 * Click anywhere to jump to that region.
 */
export function CanvasMinimap({ shapes, viewport, containerWidth, containerHeight, onNavigate }: MinimapProps) {
  const MINIMAP_W = 180;
  const MINIMAP_H = 120;

  const bounds = useMemo(() => {
    if (shapes.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 };
    const padding = 200;
    return {
      minX: Math.min(...shapes.map(s => s.x)) - padding,
      minY: Math.min(...shapes.map(s => s.y)) - padding,
      maxX: Math.max(...shapes.map(s => s.x + s.width)) + padding,
      maxY: Math.max(...shapes.map(s => s.y + s.height)) + padding,
    };
  }, [shapes]);

  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scale = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH);

  // Viewport rectangle in minimap coordinates
  const vpX = (-viewport.x / viewport.zoom - bounds.minX) * scale;
  const vpY = (-viewport.y / viewport.zoom - bounds.minY) * scale;
  const vpW = (containerWidth / viewport.zoom) * scale;
  const vpH = (containerHeight / viewport.zoom) * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coords to world coords, then center viewport
    const worldX = clickX / scale + bounds.minX;
    const worldY = clickY / scale + bounds.minY;
    onNavigate(
      -(worldX * viewport.zoom) + containerWidth / 2,
      -(worldY * viewport.zoom) + containerHeight / 2,
    );
  };

  if (shapes.length === 0) return null;

  return (
    <div className="absolute bottom-28 right-6 z-40 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200/80 shadow-xl overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="px-3 py-1.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">Navigator</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
      </div>
      <svg
        width={MINIMAP_W}
        height={MINIMAP_H}
        onClick={handleClick}
        className="cursor-crosshair block"
      >
        {/* Background */}
        <rect width={MINIMAP_W} height={MINIMAP_H} fill="#fafbfc" />

        {/* Shapes as small rects */}
        {shapes.map(s => (
          <rect
            key={s.id}
            x={(s.x - bounds.minX) * scale}
            y={(s.y - bounds.minY) * scale}
            width={Math.max(3, s.width * scale)}
            height={Math.max(2, s.height * scale)}
            fill={s.color}
            rx={1}
            opacity={0.85}
          />
        ))}

        {/* Viewport indicator */}
        <rect
          x={vpX} y={vpY}
          width={Math.max(8, vpW)} height={Math.max(6, vpH)}
          fill="rgba(59,130,246,0.06)"
          stroke="#3b82f6"
          strokeWidth={1.5}
          rx={2}
          className="transition-all duration-150"
        />
      </svg>
    </div>
  );
}
