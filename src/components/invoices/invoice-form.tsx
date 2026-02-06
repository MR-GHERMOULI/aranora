"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvoice, updateInvoice } from "@/app/(dashboard)/invoices/actions"
import { Client, Project, Invoice } from "@/types"
import { useRouter } from "next/navigation"

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
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState("")
    const [status, setStatus] = useState("Draft")

    useEffect(() => {
        if (invoice) {
            setSelectedClient(invoice.client_id || "")
            setSelectedProject(invoice.project_id || "")
            setIssueDate(invoice.issue_date.split('T')[0])
            setDueDate(invoice.due_date ? invoice.due_date.split('T')[0] : "")
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
            formData.append("issueDate", issueDate);
            formData.append("dueDate", dueDate);
            formData.append("status", status); // Pass status only for updates usually, but safe to pass always/ignored by create logic if hardcoded there. Wait, create hardcodes Draft.
            formData.append("items", JSON.stringify(items));

            if (invoice) {
                await updateInvoice(formData);
            } else {
                await createInvoice(formData);
            }
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
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        required
                    >
                        <option value="">Select Client...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option value="">Select Project...</option>
                        {projects.filter(p => !selectedClient || p.client_id === selectedClient).map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                {invoice && (
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                )}
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
                                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
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
                                    onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
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
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invoice ? "Update Invoice" : "Create Invoice"}
                </Button>
            </div>
        </form>
    )
}
