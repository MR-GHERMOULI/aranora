import Link from "next/link"
import { signup } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Mail, Lock, User, Phone, Globe, ArrowRight, CheckCircle2 } from "lucide-react"

const countries = [
    "Algeria", "Bahrain", "Egypt", "Iraq", "Jordan", "Kuwait", "Lebanon", "Libya",
    "Morocco", "Oman", "Palestine", "Qatar", "Saudi Arabia", "Sudan", "Syria",
    "Tunisia", "United Arab Emirates", "Yemen", "Other"
];

export default function SignupPage() {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
                <p className="text-slate-500">Join Aranora — it's completely free!</p>
            </div>

            <Card className="shadow-xl shadow-slate-200/50 border-slate-200">
                <form>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+213 555 123 456"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country" className="text-slate-700">Country</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                                <select
                                    id="country"
                                    name="country"
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                                    required
                                >
                                    <option value="">Select your country</option>
                                    {countries.map((country) => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">Must be at least 8 characters</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-6">
                        <Button className="w-full bg-brand-primary hover:bg-brand-primary-light" formAction={signup}>
                            Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <p className="text-xs text-center text-slate-500">
                            By signing up, you agree to our{" "}
                            <Link href="/terms" className="text-brand-primary hover:underline">Terms</Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>

            {/* Benefits */}
            <div className="bg-white/50 rounded-xl p-4 space-y-2">
                {[
                    "100% Free — No hidden fees",
                    "Unlimited projects & clients",
                    "Smart invoicing & contracts"
                ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-brand-secondary-dark flex-shrink-0" />
                        {benefit}
                    </div>
                ))}
            </div>

            <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-primary hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
