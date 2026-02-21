import { getContractByToken } from "@/app/(dashboard)/contracts/actions";
import SigningPageClient from "./signing-page-client";

export const dynamic = 'force-dynamic';

export default async function SigningPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const contract = await getContractByToken(token);

    return <SigningPageClient contract={contract} token={token} />;
}
