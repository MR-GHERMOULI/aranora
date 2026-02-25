"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type SupabaseContext = {
    supabase: SupabaseClient;
    user: User | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [supabase] = useState(() => createClient());
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }

            if (event === "SIGNED_OUT") {
                // Refresh to clear server components cache
                router.refresh();
            } else if (event === "TOKEN_REFRESHED") {
                // Ensure Next.js middleware gets the new cookies
                router.refresh();
            }
        });

        // Initialize user
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    return (
        <Context.Provider value={{ supabase, user }}>
            {children}
        </Context.Provider>
    );
}

export const useSupabase = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error("useSupabase must be used inside SupabaseProvider");
    }
    return context;
};
