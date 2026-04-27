import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendEmailProps {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailProps) {
  const resendInstance = getResend();
  
  if (!resendInstance) {
    console.error('RESEND_API_KEY is not set');
    return { error: 'RESEND_API_KEY is not set' };
  }

  try {
    const { data, error } = await resendInstance.emails.send({
      from: from || 'Aranora <noreply@aranora.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      
      // If domain not verified, try fallback to onboarding@resend.dev for testing
      if (error.message.includes('not verified') || error.message.includes('restricted')) {
        console.log('Attempting fallback to onboarding@resend.dev...');
        const fallback = await resendInstance.emails.send({
          from: 'Aranora <onboarding@resend.dev>',
          to: Array.isArray(to) ? to : [to],
          subject: subject + ' (Fallback)',
          html,
        });
        return fallback;
      }
      
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return { error };
  }
}
