import { getBillingInfo } from './actions';
import { BillingClient } from '@/components/billing/billing-client';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
    const billing = await getBillingInfo();

    if (!billing) {
        redirect('/login');
    }

    return <BillingClient billing={billing} />;
}
