"use client"

import { useEffect, useState } from "react";

interface ClientGreetingProps {
    fallback: string;
}

export function ClientGreeting({ fallback }: ClientGreetingProps) {
    const [greeting, setGreeting] = useState(fallback);

    useEffect(() => {
        const hour = new Date().getHours();
        let newGreeting = "Good evening";
        if (hour < 12) newGreeting = "Good morning";
        else if (hour < 18) newGreeting = "Good afternoon";
        setGreeting(newGreeting);
    }, []);

    return <>{greeting}</>;
}
