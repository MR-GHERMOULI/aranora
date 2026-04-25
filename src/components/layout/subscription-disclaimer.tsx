"use client"

import { useSubscriptionStatus } from "@/components/providers/subscription-context"
import { format, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Calendar as CalendarIcon, Clock } from "lucide-react"

export function SubscriptionDisclaimer() {
    const { 
        subscriptionStatus, 
        planType, 
        trialDaysRemaining, 
        trialEndsAt, 
        currentPeriodEnd 
    } = useSubscriptionStatus()

    if (subscriptionStatus === 'expired' || planType === 'owner') {
        return null;
    }

    const isTrial = subscriptionStatus === 'trialing'
    const endDate = isTrial ? trialEndsAt : currentPeriodEnd
    
    // If we don't have an end date, we can't show much
    if (!endDate) return null;

    const daysRemaining = isTrial 
        ? trialDaysRemaining 
        : Math.max(0, differenceInDays(new Date(endDate), new Date()))

    const formattedEndDate = format(new Date(endDate), "MMM d, yyyy")
    const planName = planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : (isTrial ? 'Trial' : 'Active')

    return (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-brand-primary/10 to-violet-500/10 border border-brand-primary/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-brand-primary" />
                    {planName} Plan
                </span>
                <Badge variant="outline" className={`text-[10px] ${daysRemaining <= 3 ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'}`}>
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </Badge>
            </div>
            
            <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Ends {formattedEndDate}</span>
                </div>
            </div>
            
            {daysRemaining <= 3 && (
                <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1 bg-rose-400/10 px-2 py-1 rounded-md border border-rose-400/20">
                    <Clock className="h-3 w-3" />
                    Renew soon to keep access
                </div>
            )}
        </div>
    )
}
