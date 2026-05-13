import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign, Users, PiggyBank } from "lucide-react";

export function NetProfitReport({ revenue, teamCosts, netProfit }: { revenue: number, teamCosts: number, netProfit: number }) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    return (
        <Card className="shadow-sm border-l-4 border-l-emerald-500 overflow-hidden relative group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
            <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-xl flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-emerald-500" />
                    Owner Net Profit
                </CardTitle>
                <CardDescription>Your true earnings this month after deducting team salaries</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1 bg-muted/30 p-4 rounded-xl border border-muted/50 hover:bg-muted/50 transition-colors">
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-brand-primary" />
                            Total Revenue (Monthly)
                        </div>
                        <div className="text-2xl font-semibold text-brand-primary">
                            {formatCurrency(revenue || 0)}
                        </div>
                    </div>
                    
                    <div className="space-y-1 bg-muted/30 p-4 rounded-xl border border-muted/50 hover:bg-muted/50 transition-colors">
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-500" />
                            Team Salaries & Costs
                        </div>
                        <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                            - {formatCurrency(teamCosts || 0)}
                        </div>
                    </div>

                    <div className="space-y-1 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                        <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            Net Profit
                        </div>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(netProfit || 0)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
