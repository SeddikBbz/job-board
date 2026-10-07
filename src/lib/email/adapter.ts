import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import type { EmailAdapter } from 'payload'

const from = {
  defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@jobboard.local',
  defaultFromName: 'JobBoard',
}

// Resend in production/preview, Mailpit (SMTP) in local development, otherwise Payload logs
// emails to the console. Switching provider only touches this file.
export const emailAdapter = (): Promise<EmailAdapter> | EmailAdapter | undefined => {
  if (process.env.RESEND_API_KEY) {
    return resendAdapter({ ...from, apiKey: process.env.RESEND_API_KEY })
  }
  if (process.env.SMTP_HOST) {
    return nodemailerAdapter({
      ...from,
      // Mailpit accepts plain SMTP on localhost with no auth
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false,
      },
    })
  }
  // Note: nodemailerAdapter() without options would create a public Ethereal test account; we don't want that.
  return undefined
}
