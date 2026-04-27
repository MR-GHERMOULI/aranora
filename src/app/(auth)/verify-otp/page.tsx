import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import OtpForm from '@/components/auth/OtpForm'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 2) + '***' + local.slice(-1)
    return `${masked}@${domain}`
}

function hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
}

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function VerifyOtpPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Must be logged in to see this page
    if (!user || !user.email) {
        redirect('/login')
    }

    // Check if MFA cookie is already valid
    const cookieStore = await cookies()
    const mfaCookie = cookieStore.get('aranora_mfa_verified')
    if (mfaCookie?.value === user.id) {
        redirect('/dashboard')
    }

    // Send the OTP automatically on page load (server-side)
    const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return [] }, setAll() { } } }
    )

    // Invalidate old codes
    await serviceClient
        .from('login_otp_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('used_at', null)

    // Generate and store new OTP
    const code = generateOtp()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await serviceClient.from('login_otp_codes').insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
    })

    // Send via Resend if key available, otherwise log to console in dev
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
        const digits = code.split('')
        const html = buildOtpEmail(code, user.email, digits)
        await sendEmail({
            to: user.email,
            subject: 'Your Aranora login code',
            html,
        })
    } else if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔐 OTP CODE for ${user.email}: ${code}\n`)
    }

    const maskedEmail = maskEmail(user.email)

    return <OtpForm maskedEmail={maskedEmail} />
}

function buildOtpEmail(code: string, email: string, digits: string[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your login code — Aranora</title>
<style>
body,p,h1{margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#F1F5F9;color:#1E293B;-webkit-font-smoothing:antialiased;}
table{border-spacing:0;border-collapse:collapse;}
td{padding:0;}
.wrapper{width:100%;background:#F1F5F9;padding:40px 0 60px;}
.main{background:#FFF;margin:0 auto;width:100%;max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.08);}
.header{background:linear-gradient(135deg,#1E3A5F 0%,#2E5A8F 100%);padding:36px 40px;text-align:center;}
.logo{font-size:28px;font-weight:800;color:#FFF;letter-spacing:-0.5px;text-decoration:none;}
.tagline{font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px;}
.content{padding:40px;}
.title{font-size:22px;font-weight:700;color:#1E293B;text-align:center;margin-bottom:8px;}
.subtitle{font-size:15px;color:#64748B;text-align:center;line-height:1.6;margin-bottom:32px;}
.code-wrap{text-align:center;margin:32px 0;}
.code-inner{display:inline-block;background:linear-gradient(135deg,#F8FAFC,#EFF6FF);border:2px solid #BFDBFE;border-radius:16px;padding:24px 32px;}
.digits{font-size:36px;font-weight:900;letter-spacing:12px;color:#1E3A5F;font-family:'Courier New',Courier,monospace;}
.expiry{font-size:12px;color:#94A3B8;margin-top:10px;}
.info{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 22px;margin:24px 0;font-size:13px;color:#64748B;line-height:1.6;}
.warn{background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:13px;color:#92400E;line-height:1.5;}
.divider{height:1px;background:linear-gradient(90deg,transparent,#E2E8F0,transparent);margin:28px 0;}
.footer{background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;}
.f-brand{font-size:15px;font-weight:700;color:#1E3A5F;margin-bottom:6px;}
.f-link{font-size:12px;color:#64748B;text-decoration:none;margin:0 8px;}
.f-sep{color:#CBD5E1;}
.f-copy{font-size:11px;color:#94A3B8;margin-top:10px;}
</style>
</head>
<body>
<center class="wrapper">
<table class="main" width="100%" role="presentation">
<tr><td class="header">
<a href="https://www.aranora.com" class="logo">Aranora<span style="color:#4ADE80;">.</span></a>
<p class="tagline">Your Freelance Business, Professionally Managed</p>
</td></tr>
<tr><td class="content">
<div style="text-align:center;padding-top:8px;margin-bottom:24px;font-size:48px;">🔐</div>
<h1 class="title">Your Login Verification Code</h1>
<p class="subtitle">Use this 6-digit code to complete your sign-in.<br>It expires in <strong>10 minutes</strong>.</p>
<div class="code-wrap">
<div class="code-inner">
<p class="digits">${code}</p>
<p class="expiry">⏱ Expires in 10 minutes · Do not share this code</p>
</div>
</div>
<div class="info">
<strong>Why am I receiving this?</strong><br>
Someone (hopefully you!) signed in to Aranora using <strong>${email}</strong>. This monthly verification keeps your account secure.
</div>
<div class="warn">
🔒 If you did not attempt to log in, please change your password immediately at <a href="https://www.aranora.com/forgot-password" style="color:#1E3A5F;">aranora.com/forgot-password</a>
</div>
<div class="divider"></div>
<p style="font-size:13px;color:#94A3B8;text-align:center;">This code was requested for ${email}</p>
</td></tr>
<tr><td class="footer">
<p class="f-brand">Aranora<span style="color:#4ADE80;">.</span></p>
<div><a href="https://www.aranora.com" class="f-link">Website</a><span class="f-sep">•</span><a href="https://www.aranora.com/terms" class="f-link">Terms</a><span class="f-sep">•</span><a href="https://www.aranora.com/privacy" class="f-link">Privacy</a></div>
<p class="f-copy">&copy; 2026 Aranora. All rights reserved.</p>
</td></tr>
</table>
</center>
</body>
</html>`
}
