'use client';

import type { NexusShape } from '@/types/nexus';
import { useRef, useEffect, useCallback } from 'react';

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

  // ── Shape path builders ──────────────────────────────
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

  // ── Border color based on state ──────────────────────
  const strokeColor = isSelected
    ? '#3b82f6'
    : isConnectSource
    ? '#f59e0b'
    : shape.borderColor;
  const strokeWidth = isSelected || isConnectSource ? 2.5 : 1.5;

  // ── Gradient ID (unique per shape) ───────────────────
  const gradId = `grad-${shape.id}`;
  const shadowId = `shadow-${shape.id}`;

  // ── Text area for foreignObject ──────────────────────
  const textPadX = shape.type === 'diamond' ? shape.width * 0.2
    : shape.type === 'parallelogram' ? shape.width * 0.14
    : 12;
  const textWidth = shape.type === 'diamond' ? shape.width * 0.6
    : shape.type === 'parallelogram' ? shape.width * 0.72
    : shape.width - 24;
  const textPadY = 10;
  const textHeight = shape.height - textPadY * 2;

  // Parse color to lighter tone for gradient top
  const isLight = isLightColor(shape.color);

  return (
    <g
      transform={`translate(${shape.x}, ${shape.y})`}
      style={{ cursor: isEditing ? 'text' : 'grab' }}
      onMouseDown={e => { if (!isEditing) onMouseDown(e, shape.id); }}
      onDoubleClick={() => onDoubleClick(shape.id)}
    >
      <defs>
        {/* Subtle vertical gradient for depth */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lightenColor(shape.color, 18)} />
          <stop offset="100%" stopColor={darkenColor(shape.color, 8)} />
        </linearGradient>
        {/* Drop shadow filter */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow
            dx="0" dy={isSelected ? 6 : 3}
            stdDeviation={isSelected ? 10 : 5}
            floodColor={isSelected ? '#3b82f6' : '#00000022'}
            floodOpacity={isSelected ? 0.35 : 0.22}
          />
        </filter>
      </defs>

      {/* ── Main shape body ── */}
      <g filter={`url(#${shadowId})`}>
        {shape.type === 'circle' ? (
          <ellipse
            cx={shape.width / 2} cy={shape.height / 2}
            rx={shape.width / 2 - 2} ry={shape.height / 2 - 2}
            fill={`url(#${gradId})`}
            stroke={strokeColor} strokeWidth={strokeWidth}
          />
        ) : shape.type === 'rectangle' ? (
          <rect
            x={2} y={2} width={shape.width - 4} height={shape.height - 4}
            rx={12} ry={12}
            fill={`url(#${gradId})`}
            stroke={strokeColor} strokeWidth={strokeWidth}
          />
        ) : (
          <path
            d={getSvgPath()}
            fill={`url(#${gradId})`}
            stroke={strokeColor} strokeWidth={strokeWidth}
          />
        )}
      </g>

      {/* ── Highlight sheen (top gloss) ── */}
      {shape.type === 'rectangle' && (
        <rect
          x={4} y={4} width={shape.width - 8} height={Math.min(28, shape.height / 3)}
          rx={10} ry={10}
          fill="rgba(255,255,255,0.12)"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* ── Selection dashed outline ── */}
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

      {/* ── Connect source pulse ring ── */}
      {isConnectSource && (
        <ellipse
          cx={shape.width / 2} cy={shape.height / 2}
          rx={shape.width / 2 + 12} ry={shape.height / 2 + 12}
          fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.4}
          style={{ pointerEvents: 'none' }}
        >
          <animate attributeName="r" values="0;1" dur="0" />
          <animate attributeName="opacity" values="0.5;0" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="rx" values={`${shape.width / 2 + 4};${shape.width / 2 + 18}`} dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="ry" values={`${shape.height / 2 + 4};${shape.height / 2 + 18}`} dur="1.2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* ── Text / Edit area ── */}
      <foreignObject x={textPadX} y={textPadY} width={textWidth} height={textHeight}>
        {isEditing ? (
          <textarea
            ref={textRef}
            value={shape.text}
            onChange={e => onTextChange(shape.id, e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-center"
            style={{
              color: shape.textColor,
              fontSize: `${shape.fontSize}px`,
              fontFamily: "'Inter', system-ui, sans-serif",
              lineHeight: '1.4',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            placeholder="Type here…"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-center overflow-hidden select-none"
            style={{
              color: shape.textColor,
              fontSize: `${shape.fontSize}px`,
              fontFamily: "'Inter', system-ui, sans-serif",
              lineHeight: '1.4',
              fontWeight: 500,
              wordBreak: 'break-word',
            }}
          >
            {shape.text || (
              <span style={{ opacity: 0.35, fontSize: '11px', fontWeight: 400 }}>
                Double-click to edit
              </span>
            )}
          </div>
        )}
      </foreignObject>

      {/* ── Resize handle (selected, not editing) ── */}
      {isSelected && !isEditing && (
        <rect
          x={shape.width - 6} y={shape.height - 6}
          width={10} height={10} rx={2}
          fill="#3b82f6" stroke="white" strokeWidth={1.5}
          style={{ cursor: 'nwse-resize' }}
        />
      )}
    </g>
  );
}

// ── Color utilities ───────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function lightenColor(hex: string, amount: number): string {
  if (!hex.startsWith('#')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

function darkenColor(hex: string, amount: number): string {
  if (!hex.startsWith('#')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r - amount, g - amount, b - amount);
}

function isLightColor(hex: string): boolean {
  if (!hex.startsWith('#')) return false;
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
