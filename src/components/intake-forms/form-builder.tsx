"use client"

import { useState } from "react"
import {
    Plus, Loader2, ArrowRight, ArrowLeft, Check, Trash2, GripVertical,
    Sparkles, Type, AlignLeft, Mail, Phone, Hash, List, CheckSquare,
    Calendar, DollarSign, Upload, Heading, Eye, Copy, Settings2,
    FileText, ChevronRight, Wand2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { createIntakeForm } from "@/app/(dashboard)/intake-forms/actions"
import { getFormTemplates } from "@/lib/intake-form-templates"
import { IntakeFormField, IntakeFieldType } from "@/types"
import { v4 as uuidv4 } from 'uuid'

interface FormBuilderProps {
    onCreated?: () => void;
}

const STEPS = [
    { id: 1, title: "Setup", description: "Name & Template" },
    { id: 2, title: "Fields", description: "Build Form" },
    { id: 3, title: "Settings", description: "Customize" },
    { id: 4, title: "Preview", description: "Launch" },
]

const FIELD_TYPES: { type: IntakeFieldType; label: string; icon: any; description: string }[] = [
    { type: "text", label: "Short Text", icon: Type, description: "Single line input" },
    { type: "textarea", label: "Long Text", icon: AlignLeft, description: "Multi-line paragraph" },
    { type: "email", label: "Email", icon: Mail, description: "Email address" },
    { type: "phone", label: "Phone", icon: Phone, description: "Phone number" },
    { type: "number", label: "Number", icon: Hash, description: "Numeric value" },
    { type: "select", label: "Dropdown", icon: List, description: "Single choice" },
    { type: "multiselect", label: "Multi Select", icon: CheckSquare, description: "Multiple choices" },
    { type: "date", label: "Date", icon: Calendar, description: "Date picker" },
    { type: "budget_range", label: "Budget Range", icon: DollarSign, description: "Min/max budget" },
    { type: "file", label: "File Upload", icon: Upload, description: "Attachments" },
    { type: "section_header", label: "Section Title", icon: Heading, description: "Visual divider" },
]

export function FormBuilder({ onCreated }: FormBuilderProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [fields, setFields] = useState<IntakeFormField[]>([])
    const [settings, setSettings] = useState({
        welcomeMessage: "",
        thankYouMessage: "Thank you for your submission! We'll review your request and get back to you soon.",
        collectPhone: true,
        collectCompany: true,
        brandColor: "#6366f1"
    })

    const [showFieldPicker, setShowFieldPicker] = useState(false)
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)

    const templates = getFormTemplates()

    const resetForm = () => {
        setCurrentStep(1)
        setTitle("")
        setDescription("")
        setFields([])
        setSettings({
            welcomeMessage: "",
            thankYouMessage: "Thank you for your submission! We'll review your request and get back to you soon.",
            collectPhone: true,
            collectCompany: true,
            brandColor: "#6366f1"
        })
        setShowFieldPicker(false)
        setEditingFieldIndex(null)
    }

    const handleTemplateSelect = (template: typeof templates[0]) => {
        setTitle(template.name.replace(/^[^\w]*\s*/, ''))
        setDescription(template.description)
        setFields(template.fields.map(f => ({ ...f, id: uuidv4() })))
        setSettings(prev => ({ ...prev, ...template.settings }))
    }

    const addField = (type: IntakeFieldType) => {
        const newField: IntakeFormField = {
            id: uuidv4(),
            type,
            label: "",
            required: type !== 'section_header',
            placeholder: "",
            options: type === 'select' || type === 'multiselect' ? ["Option 1"] : undefined,
        }
        setFields(prev => [...prev, newField])
        setEditingFieldIndex(fields.length)
        setShowFieldPicker(false)
    }

    const updateField = (index: number, updates: Partial<IntakeFormField>) => {
        setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
    }

    const removeField = (index: number) => {
        setFields(prev => prev.filter((_, i) => i !== index))
        if (editingFieldIndex === index) setEditingFieldIndex(null)
    }

    const moveField = (from: number, to: number) => {
        if (to < 0 || to >= fields.length) return
        const newFields = [...fields]
        const [moved] = newFields.splice(from, 1)
        newFields.splice(to, 0, moved)
        setFields(newFields)
        if (editingFieldIndex === from) setEditingFieldIndex(to)
    }

    const addOption = (fieldIndex: number) => {
        const field = fields[fieldIndex]
        if (field.options) {
            updateField(fieldIndex, { options: [...field.options, `Option ${field.options.length + 1}`] })
        }
    }

    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
        const field = fields[fieldIndex]
        if (field.options) {
            const newOptions = [...field.options]
            newOptions[optionIndex] = value
            updateField(fieldIndex, { options: newOptions })
        }
    }

    const removeOption = (fieldIndex: number, optionIndex: number) => {
        const field = fields[fieldIndex]
        if (field.options && field.options.length > 1) {
            updateField(fieldIndex, { options: field.options.filter((_, i) => i !== optionIndex) })
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await createIntakeForm({
                title,
                description,
                fields,
                settings
            })
            setOpen(false)
            resetForm()
            onCreated?.()
        } catch (error) {
            console.error(error)
            alert("Failed to create form")
        } finally {
            setLoading(false)
        }
    }

    const isNextDisabled = () => {
        if (currentStep === 1) return !title.trim()
        if (currentStep === 2) return fields.length === 0
        return false
    }

    const getFieldIcon = (type: IntakeFieldType) => {
        return FIELD_TYPES.find(ft => ft.type === type)?.icon || Type
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-11 px-6 shadow-lg shadow-brand-primary/20 gap-2 shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Sparkles className="h-4 w-4" />
                    Create Intake Form
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] w-full p-0 overflow-hidden border-none shadow-2xl gap-0 max-h-[95dvh] flex flex-col">
                <div className="flex flex-col min-h-0 flex-1 bg-white dark:bg-slate-950">
                    {/* Dark Header */}
                    <div className="bg-gradient-to-br from-brand-primary via-brand-primary-light to-brand-secondary text-white px-8 pt-7 pb-5 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid-intake" width="8" height="8" patternUnits="userSpaceOnUse">
                                        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#grid-intake)" />
                            </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-between mb-7">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center ring-1 ring-white/10">
                                    <FileText className="h-7 w-7 text-brand-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Intake Form Builder</h2>
                                    <p className="text-white/70 text-sm mt-0.5">Create a professional client questionnaire</p>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Step {currentStep} of 4</span>
                                <div className="text-sm font-semibold text-brand-secondary mt-1">{STEPS[currentStep - 1].title}</div>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="relative z-10 flex gap-3">
                            {STEPS.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div key={step.id} className="flex-1 group">
                                        <div className="relative">
                                            <div className={`h-1.5 rounded-full transition-all duration-700 ${isCompleted ? 'bg-brand-secondary' : isActive ? 'bg-brand-secondary/40' : 'bg-white/10'}`} />
                                            {isActive && (
                                                <motion.div layoutId="intake-step-glow" className="absolute inset-0 bg-brand-secondary rounded-full blur-md opacity-40" />
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-bold transition-colors ${isCompleted ? 'bg-brand-secondary text-white' : isActive ? 'bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30' : 'bg-white/10 text-white/40'}`}>
                                                {isCompleted ? <Check className="h-2.5 w-2.5" /> : step.id}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-brand-secondary' : isCompleted ? 'text-white' : 'text-white/40'}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="h-full px-8 py-8"
                            >
                                {/* STEP 1: Setup */}
                                {currentStep === 1 && (
                                    <div className="space-y-8 max-w-2xl mx-auto">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-6 w-1 bg-brand-secondary rounded-full" />
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Form Details</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Form Title *</Label>
                                                <div className="relative group">
                                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-secondary transition-colors" />
                                                    <Input
                                                        placeholder="e.g. Web Design Project Request"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className="h-13 pl-12 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-200 focus-visible:ring-brand-secondary/20 focus-visible:border-brand-secondary rounded-xl font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Description (shown to clients)</Label>
                                                <Textarea
                                                    placeholder="Describe what information you need from the client..."
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="min-h-[80px] bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-200 focus-visible:ring-brand-secondary/20 focus-visible:border-brand-secondary rounded-xl"
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-1 bg-brand-primary rounded-full" />
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Start from Template</h3>
                                                </div>
                                                <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-brand-primary/10 text-[10px]">
                                                    {templates.length} AVAILABLE
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {templates.map((t, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleTemplateSelect(t)}
                                                        className="group relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-secondary/20 hover:shadow-md hover:bg-brand-secondary/5 dark:hover:bg-brand-secondary/10"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xl shrink-0">{t.name.split(' ')[0]}</div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{t.name.replace(/^[^\w]*\s*/, '')}</span>
                                                                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.fields.length} fields</span>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-secondary transition-colors ml-auto shrink-0" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {fields.length > 0 && (
                                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                    <span className="text-xs font-semibold text-emerald-700">Template loaded — {fields.length} fields added. You can customize them in the next step.</span>
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                )}

                                {/* STEP 2: Fields */}
                                {currentStep === 2 && (
                                    <div className="space-y-6 max-w-2xl mx-auto">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-1 bg-brand-secondary rounded-full" />
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Form Fields</h3>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">{fields.length}</Badge>
                                            </div>
                                            <Button
                                                onClick={() => setShowFieldPicker(!showFieldPicker)}
                                                className="bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary font-bold h-9 px-4 rounded-lg border border-brand-secondary/20 gap-2 shrink-0"
                                            >
                                                <Plus className="h-4 w-4" /> Add Field
                                            </Button>
                                        </div>

                                        {/* Field Type Picker */}
                                        <AnimatePresence>
                                            {showFieldPicker && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Choose Field Type</p>
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {FIELD_TYPES.map(ft => (
                                                                <button
                                                                    key={ft.type}
                                                                    onClick={() => addField(ft.type)}
                                                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 hover:bg-brand-secondary/10 hover:text-brand-secondary border border-transparent hover:border-brand-secondary/20 transition-all text-center group"
                                                                >
                                                                    <ft.icon className="h-5 w-5 text-slate-400 group-hover:text-brand-secondary transition-colors" />
                                                                    <span className="text-[10px] font-bold">{ft.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Field List */}
                                        <div className="space-y-2">
                                            {fields.map((field, index) => {
                                                const FieldIcon = getFieldIcon(field.type)
                                                const isEditing = editingFieldIndex === index
                                                return (
                                                    <motion.div
                                                        key={field.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`bg-white dark:bg-slate-800 border rounded-xl transition-all ${isEditing ? 'border-brand-secondary/30 shadow-md ring-1 ring-brand-secondary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                                    >
                                                        {/* Field Header */}
                                                        <div
                                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                                            onClick={() => setEditingFieldIndex(isEditing ? null : index)}
                                                        >
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={(e) => { e.stopPropagation(); moveField(index, index - 1) }} className="text-slate-300 hover:text-slate-600 p-0.5" disabled={index === 0}>
                                                                    <GripVertical className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${field.type === 'section_header' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                                                                <FieldIcon className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold truncate ${field.label ? 'text-slate-800 dark:text-white' : 'text-slate-400 italic'}`}>
                                                                    {field.label || 'Untitled field'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">{FIELD_TYPES.find(ft => ft.type === field.type)?.label} {field.required ? '• Required' : ''}</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); removeField(index) }}
                                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {/* Editing Panel */}
                                                        <AnimatePresence>
                                                            {isEditing && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="border-t border-slate-100 px-4 py-4 overflow-hidden"
                                                                >
                                                                    <div className="space-y-4">
                                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                                            <div className="space-y-2">
                                                                                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Label *</Label>
                                                                                <Input
                                                                                    placeholder="Field label"
                                                                                    value={field.label}
                                                                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                                                                    className="h-10 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-200 rounded-lg"
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Placeholder</Label>
                                                                                <Input
                                                                                    placeholder="Placeholder text"
                                                                                    value={field.placeholder || ''}
                                                                                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                                                    className="h-10 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-200 rounded-lg"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                                            <div className="space-y-2">
                                                                                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Help Text</Label>
                                                                                <Input
                                                                                    placeholder="Additional guidance for the client"
                                                                                    value={field.helpText || ''}
                                                                                    onChange={(e) => updateField(index, { helpText: e.target.value })}
                                                                                    className="h-10 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-200 rounded-lg"
                                                                                />
                                                                            </div>
                                                                            {field.type !== 'section_header' && (
                                                                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Required field</span>
                                                                                    <Switch
                                                                                        checked={field.required}
                                                                                        onCheckedChange={(v) => updateField(index, { required: v })}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Options for select/multiselect */}
                                                                        {(field.type === 'select' || field.type === 'multiselect') && field.options && (
                                                                            <div className="space-y-2">
                                                                                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Options</Label>
                                                                                {field.options.map((opt, oi) => (
                                                                                    <div key={oi} className="flex gap-2">
                                                                                        <Input
                                                                                            value={opt}
                                                                                            onChange={(e) => updateOption(index, oi, e.target.value)}
                                                                                            className="h-9 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-200 rounded-lg flex-1"
                                                                                            placeholder={`Option ${oi + 1}`}
                                                                                        />
                                                                                        <Button
                                                                                            variant="ghost" size="icon"
                                                                                            className="h-9 w-9 text-slate-300 hover:text-red-500"
                                                                                            onClick={() => removeOption(index, oi)}
                                                                                            disabled={field.options!.length <= 1}
                                                                                        >
                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                                <Button
                                                                                    variant="outline" size="sm"
                                                                                    onClick={() => addOption(index)}
                                                                                    className="h-8 text-xs gap-1"
                                                                                >
                                                                                    <Plus className="h-3 w-3" /> Add Option
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                )
                                            })}
                                            {fields.length === 0 && (
                                                <div className="py-16 text-center">
                                                    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                        <Wand2 className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-500 mb-1">No fields yet</p>
                                                    <p className="text-xs text-slate-400">Click &quot;Add Field&quot; above or go back to select a template</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Settings */}
                                {currentStep === 3 && (
                                    <div className="space-y-8 max-w-2xl mx-auto">
                                        <section className="space-y-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-6 w-1 bg-brand-secondary rounded-full" />
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Messages</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Welcome Message</Label>
                                                <Textarea
                                                    placeholder="e.g. Thanks for considering working with us! Please fill out this form..."
                                                    value={settings.welcomeMessage}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                                    className="min-h-[70px] bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-200 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Thank You Message (after submission)</Label>
                                                <Textarea
                                                    placeholder="e.g. Thank you! We'll review and get back to you..."
                                                    value={settings.thankYouMessage}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                                                    className="min-h-[70px] bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-200 rounded-xl"
                                                />
                                            </div>
                                        </section>

                                        <section className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-5">
                                            <div className="flex items-center gap-2">
                                                <Settings2 className="h-5 w-5 text-brand-primary" />
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Client Information</h4>
                                            </div>
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                <div className="py-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Collect Phone Number</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Ask for client&apos;s phone number</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.collectPhone}
                                                        onCheckedChange={(v) => setSettings(prev => ({ ...prev, collectPhone: v }))}
                                                    />
                                                </div>
                                                <div className="py-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Collect Company Name</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">Ask for organization or company</p>
                                                    </div>
                                                    <Switch
                                                        checked={settings.collectCompany}
                                                        onCheckedChange={(v) => setSettings(prev => ({ ...prev, collectCompany: v }))}
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* STEP 4: Preview */}
                                {currentStep === 4 && (
                                    <div className="space-y-6 max-w-2xl mx-auto">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm transition-colors"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <Check className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Form Ready to Launch!</h4>
                                                <p className="text-xs text-emerald-700/80 dark:text-emerald-500/80 font-medium">Review the summary below, then click "Create & Launch" to generate your shareable link.</p>
                                            </div>
                                        </motion.div>

                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="bg-slate-900 text-white px-6 py-4">
                                                <h4 className="font-bold text-lg">{title}</h4>
                                                {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Fields</p>
                                                        <p className="font-bold text-slate-900 dark:text-white">{fields.length}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Required Fields</p>
                                                        <p className="font-bold text-slate-900 dark:text-white">{fields.filter(f => f.required).length}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Phone Collection</p>
                                                        <p className="font-bold text-slate-900 dark:text-white">{settings.collectPhone ? 'Yes' : 'No'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Company Collection</p>
                                                        <p className="font-bold text-slate-900 dark:text-white">{settings.collectCompany ? 'Yes' : 'No'}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Fields</p>
                                                    <div className="space-y-1.5">
                                                        {fields.map((field, i) => {
                                                            const Icon = getFieldIcon(field.type)
                                                            return (
                                                                <div key={field.id} className="flex items-center gap-2 text-sm">
                                                                    <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{field.label || 'Untitled'}</span>
                                                                    {field.required && <span className="text-[9px] font-bold text-brand-secondary shrink-0">REQ</span>}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                        <Button
                            variant="ghost"
                            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setOpen(false)}
                            className="text-slate-500 font-bold h-10 px-6 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {currentStep > 1 ? 'Back' : 'Cancel'}
                        </Button>
                        <div className="flex items-center gap-3">
                            {currentStep < 4 ? (
                                <Button
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    disabled={isNextDisabled()}
                                    className="bg-brand-secondary hover:bg-brand-secondary-dark text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-brand-secondary/20 gap-2 transition-all"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                    Create & Launch
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
