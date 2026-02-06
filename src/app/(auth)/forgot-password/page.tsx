import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Reset your password</h1>
                <p className="text-slate-500">Enter your email and we'll send you a reset link</p>
            </div>

            <Card className="shadow-xl shadow-slate-200/50 border-slate-200">
                <form>
                    <CardContent className="pt-6 space-y-4">
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
                    </CardContent>
                    <CardFooter className="pb-6">
                        <Button className="w-full bg-brand-primary hover:bg-brand-primary-light">
                            Send Reset Link
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <p className="text-center">
                <Link href="/login" className="text-sm text-slate-500 hover:text-brand-primary inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </p>
        </div>
    )
}
