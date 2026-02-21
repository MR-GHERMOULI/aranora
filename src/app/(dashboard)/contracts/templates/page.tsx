import { getTemplates } from "../actions";
import { TemplateDialog } from "@/components/contracts/template-dialog";
import { DeleteTemplateDialog } from "@/components/contracts/delete-template-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return (
        <div className="px-4 lg:px-8 space-y-4 pt-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/contracts">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-brand-primary">Contract Templates</h2>
                        <p className="text-muted-foreground">
                            Create reusable templates for your contracts.
                        </p>
                    </div>
                </div>
                <TemplateDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No templates yet. Create your first template to get started.</p>
                    </div>
                ) : (
                    templates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow group">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <CardTitle className="text-lg font-semibold truncate">
                                        {template.name}
                                    </CardTitle>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TemplateDialog
                                        template={template}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        }
                                    />
                                    <DeleteTemplateDialog templateId={template.id} templateName={template.name} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {template.content}
                                </p>

                                {template.contract_data && (
                                    <div className="flex flex-wrap gap-2 py-2 border-y border-dashed border-slate-100">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-tight">
                                            <ShieldCheck className="h-3 w-3" />
                                            Smart Template
                                        </div>
                                        {(template.contract_data as any)?.total_amount > 0 && (
                                            <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                                                {(template.contract_data as any).total_amount} {(template.contract_data as any).currency}
                                            </div>
                                        )}
                                        <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium uppercase">
                                            {(template.contract_data as any).payment_type}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center text-xs text-muted-foreground pt-1">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
