import { getSmartReminders, SmartReminder } from "@/app/(dashboard)/dashboard/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

export async function SmartRemindersWidget() {
    const reminders = await getSmartReminders();

    if (reminders.length === 0) {
        return null; // Don't show if nothing to remind
        // Alternatively, show a "All good" state
    }

    return (
        <Card className="border-l-4 border-l-brand-primary/50 shadow-md">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Smart Reminders
                </CardTitle>
                <CardDescription>
                    Actionable insights for your business.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
                {reminders.map((reminder) => (
                    <div
                        key={reminder.id}
                        className={cn(
                            "flex items-start gap-4 p-3 rounded-lg border transition-colors hover:bg-accent/50",
                            reminder.severity === 'high' ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" :
                                reminder.severity === 'medium' ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30" : "bg-card"
                        )}
                    >
                        <div className="mt-1">
                            {reminder.severity === 'high' ? (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : reminder.severity === 'medium' ? (
                                <Clock className="h-5 w-5 text-yellow-600" />
                            ) : (
                                <Lightbulb className="h-5 w-5 text-brand-primary" />
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-sm">{reminder.title}</p>
                                {reminder.date && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {format(new Date(reminder.date), 'MMM d')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">{reminder.description}</p>
                            <div className="pt-2">
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                                    <Link href={reminder.actionLink} className="flex items-center">
                                        {reminder.actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
