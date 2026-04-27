import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

function hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
}

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const serviceClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll() { return [] }, setAll() { } } }
        )

        // Invalidate any existing unused codes for this user
        await serviceClient
            .from('login_otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .is('used_at', null)

        // Generate new OTP
        const code = generateOtp()
        const codeHash = hashCode(code)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        const { error: insertError } = await serviceClient
            .from('login_otp_codes')
            .insert({
                user_id: user.id,
                code_hash: codeHash,
                expires_at: expiresAt.toISOString(),
            })

        if (insertError) {
            console.error('OTP insert error:', insertError)
            return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
        }

        // Send email via Supabase Auth admin (uses the project's SMTP)
        const emailHtml = buildOtpEmail(code, user.email)

        const { error: emailError } = await serviceClient.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email,
        })

        // We send the email ourselves using fetch to Supabase's email endpoint
        // Actually, we'll use the resend approach or supabase's built-in SMTP
        // The cleanest way: use Supabase admin to send via their edge functions
        // For now, use a simple fetch to the Supabase REST email sending
        const emailSent = await sendOtpEmail(user.email, code, emailHtml)

        if (!emailSent) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        // Return masked email for display
        const maskedEmail = maskEmail(user.email)
        return NextResponse.json({ success: true, maskedEmail })
    } catch (err) {
        console.error('Send OTP error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    const masked = local.slice(0, 2) + '***' + local.slice(-1)
    return `${masked}@${domain}`
}

async function sendOtpEmail(to: string, code: string, html: string): Promise<boolean> {
    try {
        const { error } = await sendEmail({
            to,
            subject: 'Your Aranora login code',
            html,
        })
        
        if (error) {
            console.error('Email send error:', error)
            
            // Fallback for dev environment if email fails
            if (process.env.NODE_ENV === 'development') {
                console.log(`\n🔐 OTP CODE for ${to}: ${code}\n`)
                return true
            }
            return false
        }
        
        return true
    } catch (err) {
        console.error('sendOtpEmail error:', err)
        return false
    }
}

function buildOtpEmail(code: string, email: string): string {
    const digits = code.split('')
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your login code — Aranora</title>
<style>
body,p,h1,h2,h3{margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background-color:#F1F5F9;color:#1E293B;-webkit-font-smoothing:antialiased;}
table{border-spacing:0;border-collapse:collapse;}
td{padding:0;}
.wrapper{width:100%;table-layout:fixed;background-color:#F1F5F9;padding:40px 0 60px 0;}
.main{background-color:#FFFFFF;margin:0 auto;width:100%;max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.08);}
.header{background:linear-gradient(135deg,#1E3A5F 0%,#2E5A8F 100%);padding:36px 40px;text-align:center;}
.logo-text{font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;text-decoration:none;}
.logo-dot{color:#4ADE80;}
.tagline{font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px;}
.content{padding:40px;}
.title{font-size:22px;font-weight:700;color:#1E293B;text-align:center;margin-bottom:8px;}
.subtitle{font-size:15px;color:#64748B;text-align:center;line-height:1.6;margin-bottom:32px;}
.code-box{text-align:center;margin:32px 0;}
.code-wrapper{display:inline-block;background:linear-gradient(135deg,#F8FAFC,#EFF6FF);border:2px solid #BFDBFE;border-radius:16px;padding:24px 36px;}
.code-digits{display:inline-flex;gap:10px;margin-bottom:8px;}
.digit{display:inline-block;width:44px;height:56px;background:#FFFFFF;border:2px solid #CBD5E1;border-radius:10px;font-size:28px;font-weight:800;color:#1E3A5F;text-align:center;line-height:56px;box-shadow:0 2px 8px rgba(30,58,95,0.08);}
.code-expiry{font-size:12px;color:#94A3B8;margin-top:8px;}
.info-box{background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 22px;margin:24px 0;}
.info-text{font-size:13px;color:#64748B;line-height:1.6;}
.security-note{background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:13px;color:#92400E;line-height:1.5;}
.divider{height:1px;background:linear-gradient(90deg,transparent,#E2E8F0,transparent);margin:28px 0;}
.footer{background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;}
.footer-brand{font-size:15px;font-weight:700;color:#1E3A5F;margin-bottom:6px;}
.footer-links{margin:10px 0;}
.footer-link{font-size:12px;color:#64748B;text-decoration:none;margin:0 8px;}
.footer-sep{color:#CBD5E1;font-size:12px;}
.footer-copy{font-size:11px;color:#94A3B8;margin-top:10px;}
</style>
</head>
<body>
<center class="wrapper">
<table class="main" width="100%" role="presentation">
<tr>
<td class="header">
<a href="https://www.aranora.com" class="logo-text">Aranora<span class="logo-dot">.</span></a>
<p class="tagline">Your Freelance Business, Professionally Managed</p>
</td>
</tr>
<tr>
<td class="content">
<div style="text-align:center;padding-top:8px;margin-bottom:24px;">
<span style="font-size:48px;">🔐</span>
</div>
<h1 class="title">Your Login Verification Code</h1>
<p class="subtitle">Use the 6-digit code below to complete your sign-in to Aranora.<br>This code expires in <strong>10 minutes</strong>.</p>

<div class="code-box">
<div class="code-wrapper">
<div class="code-digits">
${digits.map(d => `<span class="digit">${d}</span>`).join('')}
</div>
<p class="code-expiry">⏱ Expires in 10 minutes · Do not share this code</p>
</div>
</div>

<div class="info-box">
<p class="info-text">
<strong>Why am I receiving this?</strong><br>
Someone (hopefully you!) signed in to Aranora using <strong>${email}</strong>. 
This monthly verification keeps your account secure.
</p>
</div>

<div class="security-note">
🔒 If you did not attempt to log in, please change your password immediately at 
<a href="https://www.aranora.com/forgot-password" style="color:#1E3A5F;">aranora.com/forgot-password</a>
</div>

<div class="divider"></div>
<p style="font-size:13px;color:#94A3B8;text-align:center;">
This code was requested for ${email}
</p>
</td>
</tr>
<tr>
<td class="footer">
<p class="footer-brand">Aranora<span style="color:#4ADE80;">.</span></p>
<div class="footer-links">
<a href="https://www.aranora.com" class="footer-link">Website</a>
<span class="footer-sep">•</span>
<a href="https://www.aranora.com/terms" class="footer-link">Terms</a>
<span class="footer-sep">•</span>
<a href="https://www.aranora.com/privacy" class="footer-link">Privacy</a>
</div>
<p class="footer-copy">&copy; 2026 Aranora. All rights reserved.</p>
</td>
</tr>
</table>
</center>
</body>
</html>`
}
