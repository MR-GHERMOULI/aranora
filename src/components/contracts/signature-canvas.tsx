"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Undo2 } from "lucide-react"

interface SignatureCanvasProps {
    onSignatureChange: (dataUrl: string | null) => void;
    width?: number;
    height?: number;
}

export function SignatureCanvas({ onSignatureChange, width = 500, height = 200 }: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas for high DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Drawing style
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [width, height]);

    const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, [width, height]);

    const saveState = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev, imageData]);
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        saveState();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    }, [getPos, saveState]);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }, [isDrawing, getPos]);

    const stopDrawing = useCallback(() => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setHasContent(true);

        const canvas = canvasRef.current;
        if (canvas) {
            onSignatureChange(canvas.toDataURL('image/png'));
        }
    }, [isDrawing, onSignatureChange]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, width, height);
        setHasContent(false);
        setHistory([]);
        onSignatureChange(null);
    }, [width, height, onSignatureChange]);

    const undo = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || history.length === 0) return;

        const prevState = history[history.length - 1];
        ctx.putImageData(prevState, 0, 0);
        setHistory(prev => prev.slice(0, -1));

        if (history.length <= 1) {
            setHasContent(false);
            onSignatureChange(null);
        } else {
            onSignatureChange(canvas.toDataURL('image/png'));
        }
    }, [history, onSignatureChange]);

    return (
        <div className="space-y-2">
            <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden"
                style={{ touchAction: 'none' }}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair"
                    style={{ maxWidth: `${width}px`, height: `${height}px` }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">ارسم توقيعك هنا — Draw your signature here</p>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={undo}
                    disabled={history.length === 0}
                >
                    <Undo2 className="mr-1 h-3.5 w-3.5" />
                    Undo
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                    disabled={!hasContent}
                >
                    <Eraser className="mr-1 h-3.5 w-3.5" />
                    Clear
                </Button>
            </div>
        </div>
    )
}
