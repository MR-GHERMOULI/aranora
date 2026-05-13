import { getInviteDetails } from "../actions";
import { AcceptInviteClient } from "./accept-invite-client";
import { notFound } from "next/navigation";

export default async function TeamInvitePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const invite = await getInviteDetails(token);

    if (!invite) {
        notFound();
    }

    return <AcceptInviteClient invite={invite} token={token} />;
}
