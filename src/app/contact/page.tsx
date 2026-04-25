"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, MapPin, Phone, Send, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [supportEmail, setSupportEmail] = useState("support@aranora.com")
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: ""
    })

    useEffect(() => {
        const fetchBranding = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("platform_settings")
                .select("value")
                .eq("key", "branding")
                .single();
            if (data?.value?.support_email) {
                setSupportEmail(data.value.support_email);
            }
        };
        fetchBranding();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to send message")
            }

            setIsSuccess(true)
            toast.success("Message sent successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to send message. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    return (
        <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 relative">
            {/* Back Button */}
            <div className="mb-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border border-border group-hover:bg-background transition-colors">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    </span>
                    Back to Home
                </Link>
            </div>

            <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
                    <p className="text-xl text-muted-foreground">We&apos;d love to hear from you. Get in touch with our team.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            {[
                                { icon: Mail, label: "Email", value: supportEmail },
                                { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
                                { icon: MapPin, label: "Address", value: "123 Freelance Ave, San Francisco, CA 94102" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{item.label}</p>
                                        <p className="font-medium text-foreground">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-border">
                            <h3 className="font-semibold text-foreground mb-2">Office Hours</h3>
                            <p className="text-muted-foreground">Monday - Friday: 9am - 6pm PST</p>
                            <p className="text-muted-foreground">Saturday - Sunday: Closed</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <Card className="shadow-xl border-border">
                        <CardContent className="pt-6">
                            {isSuccess ? (
                                <div className="text-center py-12 space-y-4">
                                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">Message Sent!</h3>
                                    <p className="text-muted-foreground">
                                        Thanks for reaching out. We&apos;ll get back to you shortly.
                                    </p>
                                    <Button onClick={() => setIsSuccess(false)} variant="outline">
                                        Send Another
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                required
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <textarea
                                            id="message"
                                            rows={4}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="Tell us more about your inquiry..."
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-brand-primary hover:bg-brand-primary-light"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" /> Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
        </main>
    );
}
