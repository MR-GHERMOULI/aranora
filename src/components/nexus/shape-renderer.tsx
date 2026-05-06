'use client';

import type { NexusShape } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ShapeRendererProps {
  shape: NexusShape;
  isSelected: boolean;
  isConnectSource: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, shapeId: string) => void;
  onDoubleClick: (shapeId: string) => void;
  onTextChange: (shapeId: string, text: string) => void;
  editingShapeId: string | null;
}

export function ShapeRenderer({
  shape, isSelected, isConnectSource, zoom,
  onMouseDown, onDoubleClick, onTextChange, editingShapeId,
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
        return `M ${w/2} 0 L ${w} ${h/2} L ${w/2} ${h} L 0 ${h/2} Z`;
      case 'hexagon':
        const inset = w * 0.22;
        return `M ${inset} 0 L ${w - inset} 0 L ${w} ${h/2} L ${w - inset} ${h} L ${inset} ${h} L 0 ${h/2} Z`;
      case 'parallelogram':
        const skew = w * 0.18;
        return `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`;
      default:
        return '';
    }
  }, [shape.type, shape.width, shape.height]);

  const renderShape = () => {
    const commonStyle = {
      fill: shape.color,
      stroke: isSelected ? '#60a5fa' : isConnectSource ? '#f59e0b' : shape.borderColor,
      strokeWidth: isSelected || isConnectSource ? 3 : 2,
    };

    if (shape.type === 'circle') {
      return (
        <ellipse
          cx={shape.width / 2}
          cy={shape.height / 2}
          rx={shape.width / 2 - 2}
          ry={shape.height / 2 - 2}
          {...commonStyle}
        />
      );
    }

    if (shape.type === 'rectangle') {
      return (
        <rect
          x={2} y={2}
          width={shape.width - 4}
          height={shape.height - 4}
          rx={10} ry={10}
          {...commonStyle}
        />
      );
    }

    // Diamond, hexagon, parallelogram
    return <path d={getSvgPath()} {...commonStyle} />;
  };

  return (
    <g
      transform={`translate(${shape.x}, ${shape.y})`}
      style={{ cursor: isEditing ? 'text' : 'grab', zIndex: shape.zIndex }}
      onMouseDown={e => { if (!isEditing) onMouseDown(e, shape.id); }}
      onDoubleClick={() => onDoubleClick(shape.id)}
    >
      {/* Shadow */}
      <filter id={`shadow-${shape.id}`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6"
          floodColor={isSelected ? '#3b82f6' : '#000000'}
          floodOpacity={isSelected ? 0.4 : 0.3}
        />
      </filter>

      <g filter={`url(#shadow-${shape.id})`}>
        {renderShape()}
      </g>

      {/* Selection glow */}
      {isSelected && (
        <rect
          x={-4} y={-4}
          width={shape.width + 8} height={shape.height + 8}
          rx={14} ry={14}
          fill="none" stroke="#3b82f6" strokeWidth={1.5}
          strokeDasharray="6 3" opacity={0.6}
        >
          <animate attributeName="stroke-dashoffset" from="0" to="18" dur="1s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Connect source indicator */}
      {isConnectSource && (
        <rect
          x={-4} y={-4}
          width={shape.width + 8} height={shape.height + 8}
          rx={14} ry={14}
          fill="none" stroke="#f59e0b" strokeWidth={2}
          strokeDasharray="4 4" opacity={0.8}
        >
          <animate attributeName="stroke-dashoffset" from="0" to="16" dur="0.8s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Text */}
      <foreignObject
        x={shape.type === 'diamond' ? shape.width * 0.2 : shape.type === 'parallelogram' ? shape.width * 0.12 : 8}
        y={8}
        width={shape.type === 'diamond' ? shape.width * 0.6 : shape.type === 'parallelogram' ? shape.width * 0.76 : shape.width - 16}
        height={shape.height - 16}
      >
        {isEditing ? (
          <textarea
            ref={textRef}
            value={shape.text}
            onChange={e => onTextChange(shape.id, e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-center flex items-center justify-center"
            style={{
              color: shape.textColor,
              fontSize: `${shape.fontSize}px`,
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: '1.3',
              padding: '4px',
            }}
            placeholder="Type here..."
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-center overflow-hidden select-none"
            style={{
              color: shape.textColor,
              fontSize: `${shape.fontSize}px`,
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: '1.3',
              wordBreak: 'break-word',
            }}
          >
            {shape.text || (
              <span style={{ opacity: 0.4, fontSize: '12px' }}>Double-click to edit</span>
            )}
          </div>
        )}
      </foreignObject>

      {/* Resize handle (selected only) */}
      {isSelected && !isEditing && (
        <circle
          cx={shape.width} cy={shape.height}
          r={5} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1.5}
          style={{ cursor: 'nwse-resize' }}
        />
      )}
    </g>
  );
}
