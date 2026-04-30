import { Resend } from 'resend';
import { APP_NAME } from '@/lib/utils/constants';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? `noreply@offmarket.de`;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await resend.emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function emailVerificationTemplate(verifyUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0A0A0A; color: #F5F0E8;">
      <h1 style="color: #C9A84C; font-size: 28px; margin-bottom: 16px;">E-Mail-Adresse bestätigen</h1>
      <p style="color: #9CA3AF; line-height: 1.6;">Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihren Zugang zu aktivieren.</p>
      <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #C9A84C; color: #0A0A0A; text-decoration: none; font-weight: bold; border-radius: 2px;">
        E-Mail bestätigen
      </a>
      <p style="color: #666; font-size: 13px;">Dieser Link ist 24 Stunden gültig. Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail.</p>
    </div>
  `;
}

export function passwordResetTemplate(resetUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0A0A0A; color: #F5F0E8;">
      <h1 style="color: #C9A84C; font-size: 28px; margin-bottom: 16px;">Passwort zurücksetzen</h1>
      <p style="color: #9CA3AF; line-height: 1.6;">Sie haben ein neues Passwort angefordert. Klicken Sie auf den folgenden Link:</p>
      <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #C9A84C; color: #0A0A0A; text-decoration: none; font-weight: bold; border-radius: 2px;">
        Passwort zurücksetzen
      </a>
      <p style="color: #666; font-size: 13px;">Dieser Link ist 1 Stunde gültig. Falls Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail.</p>
    </div>
  `;
}

export function newInquiryTemplate(inquiry: {
  username: string;
  type: string;
  message: string;
  contactPhone?: string | null;
}): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0A0A0A; color: #F5F0E8;">
      <h1 style="color: #C9A84C; font-size: 28px; margin-bottom: 16px;">Neue Anfrage</h1>
      <p style="color: #9CA3AF;"><strong style="color: #F5F0E8;">Von:</strong> ${inquiry.username}</p>
      <p style="color: #9CA3AF;"><strong style="color: #F5F0E8;">Typ:</strong> ${inquiry.type}</p>
      ${inquiry.contactPhone ? `<p style="color: #9CA3AF;"><strong style="color: #F5F0E8;">Telefon:</strong> ${inquiry.contactPhone}</p>` : ''}
      <div style="margin-top: 16px; padding: 16px; border-left: 2px solid #C9A84C; color: #9CA3AF;">
        ${inquiry.message.replace(/\n/g, '<br>')}
      </div>
    </div>
  `;
}
