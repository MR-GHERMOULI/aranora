"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Undo2, PenTool, ShieldCheck } from "lucide-react"

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
        <div className="space-y-3">
            <div className={`relative rounded-xl border-2 transition-colors ${hasContent ? 'border-brand-primary bg-white/50' : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50'} overflow-hidden shadow-inner group`}
                style={{ touchAction: 'none' }}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair relative z-10"
                    style={{ maxWidth: `${width}px`, height: `${height}px` }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />

                {/* Visual guidelines for signature */}
                <div className="absolute inset-x-8 bottom-[25%] border-b border-slate-200 pointer-events-none z-0"></div>

                {!hasContent && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-50 group-hover:opacity-70 transition-opacity">
                        <PenTool className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-slate-500 text-sm font-medium">Draw your signature here</p>
                        <p className="text-slate-400 text-xs mt-1">يُرجى رسم توقيعك أعلاه</p>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Legally Binding
                </p>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={undo}
                        disabled={history.length === 0}
                        className="h-8 text-xs rounded-lg border-slate-200"
                    >
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                        Undo
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearCanvas}
                        disabled={!hasContent}
                        className="h-8 text-xs rounded-lg border-slate-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                    >
                        <Eraser className="mr-1.5 h-3.5 w-3.5" />
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    )
}
