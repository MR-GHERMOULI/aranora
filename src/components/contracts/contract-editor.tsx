"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Bold, Italic, Underline, Heading1, Heading2, Heading3,
    List, ListOrdered, Undo2, Redo2, Save, Loader2, CheckCircle,
    Type, AlignLeft
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ContractEditorProps {
    initialContent: string
    onSave: (content: string) => Promise<void>
    readOnly?: boolean
}

export function ContractEditor({ initialContent, onSave, readOnly = false }: ContractEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        if (editorRef.current && initialContent) {
            // If content looks like HTML, render it directly; otherwise wrap as paragraphs
            if (initialContent.includes('<') && initialContent.includes('>')) {
                editorRef.current.innerHTML = initialContent
            } else {
                editorRef.current.innerHTML = initialContent
                    .split('\n\n')
                    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                    .join('')
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value)
        editorRef.current?.focus()
        setDirty(true)
    }, [])

    const handleSave = useCallback(async () => {
        if (!editorRef.current) return
        setSaving(true)
        try {
            await onSave(editorRef.current.innerHTML)
            setDirty(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (error) {
            console.error('Error saving contract:', error)
        } finally {
            setSaving(false)
        }
    }, [onSave])

    // Keyboard shortcut: Ctrl+S to save
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [handleSave])

    const toolbarButtons = [
        { icon: Bold, command: 'bold', label: 'Bold' },
        { icon: Italic, command: 'italic', label: 'Italic' },
        { icon: Underline, command: 'underline', label: 'Underline' },
        { divider: true },
        { icon: Heading1, command: 'formatBlock', value: 'h1', label: 'Heading 1' },
        { icon: Heading2, command: 'formatBlock', value: 'h2', label: 'Heading 2' },
        { icon: Heading3, command: 'formatBlock', value: 'h3', label: 'Heading 3' },
        { icon: Type, command: 'formatBlock', value: 'p', label: 'Paragraph' },
        { divider: true },
        { icon: List, command: 'insertUnorderedList', label: 'Bullet List' },
        { icon: ListOrdered, command: 'insertOrderedList', label: 'Numbered List' },
        { divider: true },
        { icon: Undo2, command: 'undo', label: 'Undo' },
        { icon: Redo2, command: 'redo', label: 'Redo' },
    ] as const

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">

            {/* ── Toolbar ── */}
            {!readOnly && (
                <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
                    {toolbarButtons.map((btn, i) => {
                        if ('divider' in btn) {
                            return <div key={i} className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1" />
                        }
                        const Icon = btn.icon
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => execCommand(btn.command, 'value' in btn ? btn.value : undefined)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all text-xs"
                                title={btn.label}
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        )
                    })}

                    {/* Save indicator */}
                    <div className="ml-auto flex items-center gap-2">
                        <AnimatePresence>
                            {saved && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"
                                >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Saved
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {dirty && (
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || !dirty}
                            className="h-8 px-3 gap-1.5 text-xs font-bold border-slate-200"
                        >
                            {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Editor Area ── */}
            <div
                ref={editorRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={() => setDirty(true)}
                className="min-h-[400px] p-6 md:p-8 text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none
                    prose prose-slate prose-headings:font-serif prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-p:my-3 prose-li:my-1 prose-ul:my-2 prose-ol:my-2
                    max-w-none selection:bg-brand-primary/20"
                style={{ fontFamily: "'Georgia', serif" }}
            />

            {/* ── Footer Status ── */}
            {!readOnly && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <AlignLeft className="h-3 w-3" />
                        Rich text editor • Use the toolbar to format your contract
                    </span>
                    <span className="font-mono">Ctrl+S to save</span>
                </div>
            )}
        </div>
    )
}
