import { getBillingInfo, getBillingHistory } from './actions';
import { BillingClient } from '@/components/billing/billing-client';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
    const [billing, history] = await Promise.all([
        getBillingInfo(),
        getBillingHistory(),
    ]);

    if (!billing) {
        redirect('/login');
    }

    return <BillingClient billing={billing} history={history} />;
}
