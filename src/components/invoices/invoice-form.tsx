"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvoice, updateInvoice } from "@/app/(dashboard)/invoices/actions"
import { Client, Project, Invoice } from "@/types"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface InvoiceFormProps {
    clients: Client[];
    projects: Project[];
    invoice?: Invoice & { items: any[] };
}

export function InvoiceForm({ clients, projects, invoice }: InvoiceFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [items, setItems] = useState<{ description: string, quantity: number, unitPrice: number }[]>([{ description: "", quantity: 1, unitPrice: 0 }])
    const [selectedClient, setSelectedClient] = useState("")
    const [selectedProject, setSelectedProject] = useState("")
    const [issueDate, setIssueDate] = useState<Date | undefined>(new Date())
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
    const [status, setStatus] = useState("Draft")
    const [paperSize, setPaperSize] = useState<'A4' | 'LETTER'>('A4')

    useEffect(() => {
        if (invoice) {
            setSelectedClient(invoice.client_id || "")
            setSelectedProject(invoice.project_id || "")
            setIssueDate(invoice.issue_date ? new Date(invoice.issue_date) : new Date())
            setDueDate(invoice.due_date ? new Date(invoice.due_date) : undefined)
            setStatus(invoice.status)

            if (invoice.items && invoice.items.length > 0) {
                setItems(invoice.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: Number(item.unit_price) // Ensure number
                })))
            }
        }
    }, [invoice])

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    }

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            if (invoice) {
                formData.append("id", invoice.id);
            }
            formData.append("clientId", selectedClient);
            if (selectedProject) formData.append("projectId", selectedProject);
            if (issueDate) formData.append("issueDate", format(issueDate, "yyyy-MM-dd"));
            if (dueDate) formData.append("dueDate", format(dueDate, "yyyy-MM-dd"));
            formData.append("status", status);
            formData.append("items", JSON.stringify(items));

            if (invoice) {
                await updateInvoice(formData);
            } else {
                await createInvoice(formData);
            }
            router.refresh(); // Refresh to show new data
        } catch (error) {
            console.error(error);
            alert(`Failed to ${invoice ? 'update' : 'create'} invoice`);
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Client..." />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Project..." />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.filter(p => !selectedClient || p.client_id === selectedClient).map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !issueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={issueDate}
                                onSelect={setIssueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                {invoice && (
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Sent">Sent</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Paper Size</Label>
                    <Select value={paperSize} onValueChange={(v) => setPaperSize(v as 'A4' | 'LETTER')}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                            <SelectItem value="LETTER">Letter (8.5 × 11 in)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Invoice Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="md:col-span-6 space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Item description"
                                    value={item.description}
                                    onChange={e => updateItem(index, 'description', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Qty</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    required
                                />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <Label>Unit Price ($)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading} variant="secondary">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invoice ? "Update Invoice" : "Create Invoice"}
                </Button>
            </div>
        </form>
    )
}
