"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signContract } from "@/app/(dashboard)/contracts/actions"
import { PenTool, Loader2 } from "lucide-react"

interface SignContractButtonProps {
    id: string;
}

export function SignContractButton({ id }: SignContractButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleSign() {
        if (!confirm("Are you sure you want to sign this contract? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await signContract(id);
        } catch (error) {
            console.error(error);
            alert("Failed to sign contract");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button onClick={handleSign} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenTool className="mr-2 h-4 w-4" />}
            Sign Contract
        </Button>
    )

}
