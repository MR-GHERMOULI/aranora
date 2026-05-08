'use client';

import type { NexusShape, CanvasTheme } from '@/types/nexus';
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import rough from 'roughjs';

const roughGenerator = typeof window !== 'undefined' ? rough.generator() : null;

interface ShapeRendererProps {
  shape: NexusShape;
  isSelected: boolean;
  isConnectSource: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick: (shapeId: string) => void;
  onTextChange: (shapeId: string, text: string) => void;
  onContextMenu: (e: React.MouseEvent, shapeId: string) => void;
  onResizeStart: (e: React.MouseEvent, shapeId: string, handle: string) => void;
  editingShapeId: string | null;
  canvasTheme: CanvasTheme;
}

export const ShapeRenderer = React.memo(function ShapeRenderer({
  shape, isSelected, isConnectSource, zoom,
  onMouseDown, onDoubleClick, onTextChange, onContextMenu, onResizeStart, editingShapeId,
  canvasTheme,
}: ShapeRendererProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = editingShapeId === shape.id;

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const getSvgPath = useCallback(() => {
    const w = shape.width;
    const h = shape.height;
    switch (shape.type) {
      case 'diamond':
        return `M ${w / 2} 4 L ${w - 4} ${h / 2} L ${w / 2} ${h - 4} L 4 ${h / 2} Z`;
      case 'hexagon': {
        const inset = w * 0.22;
        return `M ${inset} 4 L ${w - inset} 4 L ${w - 4} ${h / 2} L ${w - inset} ${h - 4} L ${inset} ${h - 4} L 4 ${h / 2} Z`;
      }
      case 'parallelogram': {
        const sk = w * 0.16;
        return `M ${sk} 4 L ${w - 4} 4 L ${w - sk} ${h - 4} L 4 ${h - 4} Z`;
      }
      default:
        return '';
    }
  }, [shape.type, shape.width, shape.height]);

  const strokeColor = isSelected ? '#3b82f6' : isConnectSource ? '#f59e0b' : shape.borderColor;
  const strokeWidth = isSelected || isConnectSource ? 2.5 : 1.5;
  const shadowId = `shadow-${shape.id}`;

  // ── Text Formatting & Layout ────────────────────────
  const textStyles = useMemo(() => {
    const fonts = {
      sans: "'Inter', system-ui, sans-serif",
      serif: "Georgia, serif",
      mono: "monospace",
    };
    return {
      color: shape.textColor,
      fontSize: `${shape.fontSize}px`,
      fontWeight: shape.fontWeight || 'normal',
      fontStyle: shape.fontStyle || 'normal',
      textAlign: shape.textAlign || 'center',
      fontFamily: fonts[shape.fontFamily || 'sans'],
      direction: shape.direction || 'ltr',
      lineHeight: '1.4',
    };
  }, [shape]);

  // Dynamic padding based on shape type to prevent text cutoff
  const layout = useMemo(() => {
    let px = 12;
    let py = 12;
    if (shape.type === 'diamond') { px = shape.width * 0.25; py = shape.height * 0.25; }
    if (shape.type === 'circle') { px = shape.width * 0.15; py = shape.height * 0.15; }
    if (shape.type === 'hexagon') { px = shape.width * 0.25; }
    if (shape.type === 'text') { px = 4; py = 4; }
    
    return {
      x: px,
      y: py,
      width: shape.width - px * 2,
      height: shape.height - py * 2
    };
  }, [shape.type, shape.width, shape.height]);

  return (
    <g
      transform={`translate(${shape.x}, ${shape.y})`}
      style={{ cursor: isEditing ? 'text' : 'grab' }}
      onMouseDown={e => { if (!isEditing) onMouseDown(e, shape.id); }}
      onDoubleClick={() => onDoubleClick(shape.id)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, shape.id); }}
    >
      <defs>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow
            dx="0" dy={isSelected ? 4 : 2}
            stdDeviation={isSelected ? 8 : 4}
            floodColor={isSelected ? '#3b82f6' : '#000000'}
            floodOpacity={isSelected ? 0.2 : 0.06}
          />
        </filter>
      </defs>

      {/* Main body */}
      <g filter={canvasTheme === 'hand-drawn' ? `url(#${shadowId})` : 'none'}>
        {useMemo(() => {
          const w = shape.width;
          const h = shape.height;

          if (canvasTheme === 'flat') {
            // Standard SVG geometric shapes
            const commonProps = {
              fill: shape.color,
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              className: "transition-colors duration-200"
            };

            switch (shape.type) {
              case 'rectangle':
                return <rect x={4} y={4} width={w - 8} height={h - 8} rx={8} {...commonProps} />;
              case 'circle':
                return <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 4} ry={h / 2 - 4} {...commonProps} />;
              case 'diamond':
                return <path d={`M ${w / 2} 4 L ${w - 4} ${h / 2} L ${w / 2} ${h - 4} L 4 ${h / 2} Z`} {...commonProps} />;
              case 'hexagon': {
                const inset = w * 0.22;
                return <path d={`M ${inset} 4 L ${w - inset} 4 L ${w - 4} ${h / 2} L ${w - inset} ${h - 4} L ${inset} ${h - 4} L 4 ${h / 2} Z`} {...commonProps} />;
              }
              case 'parallelogram': {
                const sk = w * 0.16;
                return <path d={`M ${sk} 4 L ${w - 4} 4 L ${w - sk} ${h - 4} L 4 ${h - 4} Z`} {...commonProps} />;
              }
              case 'text':
                // For text, we don't render a background box in flat mode unless it's for a hover/hit area
                return <rect x={0} y={0} width={w} height={h} fill="transparent" stroke="none" />;
              default:
                return null;
            }
          }

          // Rough.js Hand-Drawn Style
          if (!roughGenerator) return null;
          const generator = roughGenerator;
          const options = {
            seed: 1,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            fill: shape.color,
            fillStyle: 'solid',
            roughness: 1.2,
            bowing: 1.5,
          } as any;

          let drawable;
          if (shape.type === 'circle') {
            drawable = generator.ellipse(w / 2, h / 2, w - 8, h - 8, options);
          } else if (shape.type === 'rectangle') {
            drawable = generator.rectangle(4, 4, w - 8, h - 8, options);
          } else if (shape.type === 'diamond') {
            drawable = generator.polygon([[w / 2, 4], [w - 4, h / 2], [w / 2, h - 4], [4, h / 2]], options);
          } else if (shape.type === 'hexagon') {
            const inset = w * 0.22;
            drawable = generator.polygon([[inset, 4], [w - inset, 4], [w - 4, h / 2], [w - inset, h - 4], [inset, h - 4], [4, h / 2]], options);
          } else if (shape.type === 'parallelogram') {
            const sk = w * 0.16;
            drawable = generator.polygon([[sk, 4], [w - 4, 4], [w - sk, h - 4], [4, h - 4]], options);
          } else if (shape.type === 'text') {
            // No rough shape for text type, just return null so we only see the text
            return <rect x={0} y={0} width={w} height={h} fill="transparent" stroke="none" />;
          }

          if (!drawable) return null;
          const paths = generator.toPaths(drawable);

          return drawable.sets.map((set: any, i: number) => (
            <path
              key={i}
              d={paths[i]?.d || ''}
              fill={set.type === 'fillPath' ? shape.color : 'none'}
              stroke={set.type === 'path' ? strokeColor : 'none'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ));
        }, [shape.type, shape.width, shape.height, shape.color, strokeColor, strokeWidth, canvasTheme])}
      </g>

      {/* Selection dashed outline */}
      {(isSelected || isConnectSource) && (
        <rect
          x={-6} y={-6}
          width={shape.width + 12} height={shape.height + 12}
          rx={16} ry={16}
          fill="none"
          stroke={isConnectSource ? '#f59e0b' : '#3b82f6'}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={0.7}
          style={{ pointerEvents: 'none' }}
        >
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="1.2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Text / Edit area */}
      <foreignObject x={layout.x} y={layout.y} width={layout.width} height={layout.height}>
        {isEditing ? (
          <textarea
            ref={textRef}
            value={shape.text}
            onChange={e => onTextChange(shape.id, e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none p-0 flex items-center justify-center custom-scrollbar"
            style={{
              ...textStyles,
              display: 'flex',
              alignItems: 'center',
              paddingTop: shape.type === 'text' ? '0px' : '4px',
            }}
            placeholder="Write something..."
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden select-none"
            style={{
              ...textStyles,
              wordBreak: 'break-word',
            }}
          >
            {shape.text || (
              <span style={{ opacity: 0.35, fontSize: '11px', fontWeight: 400, fontStyle: 'normal' }}>
                Double-click
              </span>
            )}
          </div>
        )}
      </foreignObject>

      {/* Resizing Handles */}
      {isSelected && !isEditing && (
        <g>
          {/* Corners */}
          <rect x={-4} y={-4} width={8} height={8} className="fill-white stroke-blue-600 cursor-nwse-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'nw'); }} />
          <rect x={shape.width - 4} y={-4} width={8} height={8} className="fill-white stroke-blue-600 cursor-nesw-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'ne'); }} />
          <rect x={-4} y={shape.height - 4} width={8} height={8} className="fill-white stroke-blue-600 cursor-nesw-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'sw'); }} />
          <rect x={shape.width - 4} y={shape.height - 4} width={8} height={8} className="fill-white stroke-blue-600 cursor-nwse-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'se'); }} />
          
          {/* Edges */}
          <rect x={shape.width / 2 - 4} y={-4} width={8} height={8} className="fill-white stroke-blue-600 cursor-ns-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'n'); }} />
          <rect x={shape.width / 2 - 4} y={shape.height - 4} width={8} height={8} className="fill-white stroke-blue-600 cursor-ns-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 's'); }} />
          <rect x={-4} y={shape.height / 2 - 4} width={8} height={8} className="fill-white stroke-blue-600 cursor-ew-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'w'); }} />
          <rect x={shape.width - 4} y={shape.height / 2 - 4} width={8} height={8} className="fill-white stroke-blue-600 cursor-ew-resize" onMouseDown={e => { e.stopPropagation(); onResizeStart(e, shape.id, 'e'); }} />
        </g>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isConnectSource === nextProps.isConnectSource &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.editingShapeId === nextProps.editingShapeId &&
    prevProps.canvasTheme === nextProps.canvasTheme &&
    prevProps.shape === nextProps.shape
  );
});
