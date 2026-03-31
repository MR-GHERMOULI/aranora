import { getIntakeFormByToken } from "@/app/(dashboard)/intake-forms/actions";
import IntakeFormClient from "./intake-form-client";

export const dynamic = 'force-dynamic';

export default async function IntakeFormPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const form = await getIntakeFormByToken(token);

    return <IntakeFormClient form={form} token={token} />;
}
