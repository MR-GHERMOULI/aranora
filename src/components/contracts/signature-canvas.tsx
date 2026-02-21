"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Undo2, PenTool, ShieldCheck, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

        // Drawing style - using a slightly richer dark slate for better contrast
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.8;
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
        <div className="space-y-4">
            <div className={`relative rounded-3xl border-2 transition-all duration-300 ${hasContent ? 'border-brand-primary bg-white shadow-xl shadow-brand-primary/5 ring-4 ring-brand-primary/5' : 'border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'} overflow-hidden group`}
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
                <div className="absolute inset-x-12 bottom-[22%] border-b-2 border-slate-100 pointer-events-none z-0"></div>
                <div className="absolute left-10 bottom-[22%] -mb-1 pointer-events-none z-0">
                    <span className="text-[10px] font-bold text-slate-300 italic">Sign here / وقع هنا</span>
                </div>

                <AnimatePresence>
                    {!hasContent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40 group-hover:opacity-60 transition-opacity"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <PenTool className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-slate-500 text-sm font-bold tracking-tight">Handwritten Signature Required</p>
                            <p className="text-slate-400 text-xs mt-1 font-medium">Click and drag to draw your sign</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {hasContent && (
                    <div className="absolute top-4 right-4 z-20">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 scale-90">
                            <Check className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">CAPTURED</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Legally Binding</span>
                    </div>
                    <div className="hidden sm:block h-3 w-px bg-slate-200" />
                    <div className="hidden sm:block text-[10px] text-slate-400 font-medium">Digital Timestamp Attached</div>
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={undo}
                        disabled={history.length === 0}
                        className="h-8 px-3 text-[11px] font-bold rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-95"
                    >
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                        Undo
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCanvas}
                        disabled={!hasContent}
                        className="h-8 px-3 text-[11px] font-bold rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                    >
                        <Eraser className="mr-1.5 h-3.5 w-3.5" />
                        Clear Canvas
                    </Button>
                </div>
            </div>
        </div>
    )
}
