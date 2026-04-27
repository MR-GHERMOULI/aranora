import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { error: 'RESEND_API_KEY is not set' };
  }

  try {
    const { data, error } = await resend.emails.send({
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
        const fallback = await resend.emails.send({
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
