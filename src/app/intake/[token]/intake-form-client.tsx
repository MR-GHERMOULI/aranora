"use client"

import { useState, useEffect } from "react"
import {
    CheckCircle, AlertCircle, Loader2, ShieldCheck, ArrowRight,
    ArrowLeft, User, Mail, Phone, Building2, FileText, Calendar,
    DollarSign, Upload, ChevronDown, X, Info
} from "lucide-react"
import Link from "next/link"
import { IntakeFormField } from "@/types"

interface FormData {
    id: string;
    title: string;
    description: string | null;
    fields: IntakeFormField[];
    settings: Record<string, any>;
    user_id: string;
    profile?: { full_name?: string; company_name?: string; logo_url?: string | null } | null;
}

interface IntakeFormClientProps {
    form: FormData | null;
    token: string;
}

export default function IntakeFormClient({ form, token }: IntakeFormClientProps) {
    const [clientName, setClientName] = useState("")
    const [clientEmail, setClientEmail] = useState("")
    const [clientPhone, setClientPhone] = useState("")
    const [clientCompany, setClientCompany] = useState("")
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentSection, setCurrentSection] = useState(0)

    if (!form) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-8 max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-foreground mb-2">Form Not Found</h1>
                    <p className="text-muted-foreground">This intake form link is invalid, expired, or no longer active.</p>
                </div>
            </div>
        )
    }

    // Split fields into sections based on section_header fields
    const sections: { title: string; fields: IntakeFormField[] }[] = []
    let currentSectionFields: IntakeFormField[] = []
    let currentSectionTitle = "Your Information"

    // First section is always client info
    sections.push({ title: "About You", fields: [] })

    form.fields.forEach((field) => {
        if (field.type === 'section_header') {
            if (currentSectionFields.length > 0) {
                sections.push({ title: currentSectionTitle, fields: currentSectionFields })
            }
            currentSectionTitle = field.label
            currentSectionFields = []
        } else {
            currentSectionFields.push(field)
        }
    })
    if (currentSectionFields.length > 0) {
        sections.push({ title: currentSectionTitle, fields: currentSectionFields })
    }

    const totalSections = sections.length
    const progress = Math.round(((currentSection + 1) / totalSections) * 100)

    const updateResponse = (fieldId: string, value: any) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }))
    }

    const validateCurrentSection = (): boolean => {
        if (currentSection === 0) {
            if (!clientName.trim()) { setError("Please enter your name"); return false }
            if (!clientEmail.trim()) { setError("Please enter your email"); return false }
            return true
        }

        const section = sections[currentSection]
        for (const field of section.fields) {
            if (field.required) {
                const value = responses[field.id]
                if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                    setError(`Please fill in "${field.label}"`)
                    return false
                }
                if (field.type === 'budget_range') {
                    if (!value.min && !value.max) {
                        setError(`Please provide a budget range for "${field.label}"`)
                        return false
                    }
                }
            }
        }
        return true
    }

    const handleNext = () => {
        setError(null)
        if (!validateCurrentSection()) return
        if (currentSection < totalSections - 1) {
            setCurrentSection(prev => prev + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleBack = () => {
        setError(null)
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleSubmit = async () => {
        setError(null)
        if (!validateCurrentSection()) return

        setLoading(true)
        try {
            const response = await fetch('/api/intake/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    clientName: clientName.trim(),
                    clientEmail: clientEmail.trim(),
                    clientPhone: clientPhone.trim() || null,
                    clientCompany: clientCompany.trim() || null,
                    responses,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit form')
            }

            setSubmitted(true)
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const isLastSection = currentSection === totalSections - 1

    const providerName = form.profile?.company_name || form.profile?.full_name || 'Service Provider'
    const brandColor = form.settings?.brandColor || '#e11d48'

    // Thank You Screen
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50/10 via-background to-emerald-50/5 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-2xl border border-emerald-100/20 p-10 max-w-lg text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>
                    <div className="h-20 w-20 bg-emerald-100/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/5">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-3">Submitted Successfully!</h1>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        {form.settings?.thankYouMessage || 'Thank you for your submission! We will review your request and get back to you soon.'}
                    </p>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-[10px] uppercase font-bold tracking-widest">
                                Submitted securely to {providerName}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderField = (field: IntakeFormField) => {
        const value = responses[field.id]

        const inputClass = "w-full h-12 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        const textareaClass = "w-full min-h-[120px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"

        switch (field.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={inputClass}
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={textareaClass}
                    />
                )

            case 'email':
                return (
                    <input
                        type="email"
                        value={value || ''}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || 'email@example.com'}
                        className={inputClass}
                    />
                )

            case 'phone':
                return (
                    <input
                        type="tel"
                        value={value || ''}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || '+1 (555) 000-0000'}
                        className={inputClass}
                    />
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || '0'}
                        className={inputClass}
                    />
                )

            case 'date':
                return (
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        className={inputClass}
                    />
                )

            case 'select':
                return (
                    <div className="relative">
                        <select
                            value={value || ''}
                            onChange={(e) => updateResponse(field.id, e.target.value)}
                            className={inputClass + " appearance-none pr-10 cursor-pointer"}
                        >
                            <option value="">{field.placeholder || 'Select an option...'}</option>
                            {field.options?.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                )

            case 'multiselect':
                const selectedValues = Array.isArray(value) ? value : []
                return (
                    <div className="space-y-2">
                        {field.options?.map((opt, i) => {
                            const isSelected = selectedValues.includes(opt)
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        const newValues = isSelected
                                            ? selectedValues.filter((v: string) => v !== opt)
                                            : [...selectedValues, opt]
                                        updateResponse(field.id, newValues)
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isSelected
                                        ? 'bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20'
                                        : 'bg-background border-input text-foreground hover:border-primary/30 hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                                            {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                        {opt}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )

            case 'budget_range':
                const budgetValue = value || { min: '', max: '', currency: 'USD' }
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    value={budgetValue.min || ''}
                                    onChange={(e) => updateResponse(field.id, { ...budgetValue, min: Number(e.target.value) })}
                                    placeholder="Min budget"
                                    className={inputClass + " pl-10"}
                                />
                            </div>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    value={budgetValue.max || ''}
                                    onChange={(e) => updateResponse(field.id, { ...budgetValue, max: Number(e.target.value) })}
                                    placeholder="Max budget"
                                    className={inputClass + " pl-10"}
                                />
                            </div>
                        </div>
                        <select
                            value={budgetValue.currency || 'USD'}
                            onChange={(e) => updateResponse(field.id, { ...budgetValue, currency: e.target.value })}
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm appearance-none cursor-pointer outline-none"
                        >
                            <option value="USD">$ USD</option>
                            <option value="EUR">€ EUR</option>
                            <option value="GBP">£ GBP</option>
                            <option value="SAR">﷼ SAR</option>
                        </select>
                    </div>
                )

            case 'date_range':
                const dateRangeValue = value || { start: '', end: '' }
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Start Date</label>
                            <input
                                type="date"
                                value={dateRangeValue.start || ''}
                                onChange={(e) => updateResponse(field.id, { ...dateRangeValue, start: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">End Date</label>
                            <input
                                type="date"
                                value={dateRangeValue.end || ''}
                                onChange={(e) => updateResponse(field.id, { ...dateRangeValue, end: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                    </div>
                )

            case 'file':
                return (
                    <div className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer bg-muted/20">
                        <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">File upload coming soon</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">For now, please share files via email or link in a text field</p>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <main className="max-w-3xl mx-auto px-4 lg:px-8 pt-32 pb-32 relative">
            {/* Back Button */}
            <div className="mb-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                    Back to Home
                </Link>
            </div>

            {/* Progress Bar (Floating below navbar if sticky or just relative) */}
            <div className="mb-8 bg-muted rounded-full h-2 overflow-hidden shadow-sm">
                <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
                {/* Title */}
                <div className="text-center mb-10 max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                        {form.title}
                    </h1>
                    {form.description && (
                        <p className="text-muted-foreground text-base leading-relaxed">{form.description}</p>
                    )}
                    {form.settings?.welcomeMessage && currentSection === 0 && (
                        <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-800 font-medium">
                            {form.settings.welcomeMessage}
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-2xl mx-auto">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Section Card */}
                <div className="bg-card shadow-xl ring-1 ring-border rounded-2xl overflow-hidden max-w-2xl mx-auto">
                    {/* Section Header */}
                    <div className="bg-foreground text-background px-6 py-4">
                        <h2 className="text-lg font-bold">{sections[currentSection].title}</h2>
                        <p className="text-muted-foreground/60 text-xs mt-0.5">
                            {currentSection === 0
                                ? 'Please provide your contact details'
                                : `${sections[currentSection].fields.filter(f => f.required).length} required fields`
                            }
                        </p>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        {/* Client Info Section */}
                        {currentSection === 0 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="e.g. Jane Doe"
                                            className="w-full h-12 rounded-xl border border-input bg-background pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            placeholder="jane@example.com"
                                            className="w-full h-12 rounded-xl border border-input bg-background pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                {form.settings?.collectPhone && (
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">
                                            Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="tel"
                                                value={clientPhone}
                                                onChange={(e) => setClientPhone(e.target.value)}
                                                placeholder="+1 (555) 000-0000"
                                                className="w-full h-12 rounded-xl border border-input bg-background pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                {form.settings?.collectCompany && (
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">
                                            Company / Organization <span className="text-muted-foreground font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={clientCompany}
                                                onChange={(e) => setClientCompany(e.target.value)}
                                                placeholder="Acme Inc."
                                                className="w-full h-12 rounded-xl border border-input bg-background pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic Fields */}
                        {currentSection > 0 && sections[currentSection].fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="block text-sm font-bold text-foreground">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.helpText && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        {field.helpText}
                                    </div>
                                )}
                                {renderField(field)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="max-w-2xl mx-auto mt-6 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentSection === 0}
                        className="flex items-center gap-2 px-5 h-12 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-card transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    {isLastSection ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 h-14 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-base"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    Submit Request
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 h-12 bg-foreground text-background font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                        >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>

            {/* Mobile Sticky Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 sm:hidden">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button
                        onClick={handleBack}
                        disabled={currentSection === 0}
                        className="px-4 h-10 text-sm font-bold text-muted-foreground disabled:opacity-30"
                    >
                        Back
                    </button>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {currentSection + 1} / {totalSections}
                    </span>
                    {isLastSection ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-5 h-10 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg"
                        >
                            {loading ? 'Sending...' : 'Submit'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-5 h-10 bg-foreground text-background rounded-xl font-bold text-sm"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </main>
    )
}
