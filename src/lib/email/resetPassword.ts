import { emailButton, emailLayout, escapeHtml, siteUrl } from './layout'

// Used by Payload's forgot-password flow (see Users.auth.forgotPassword).
// Links to our own /reset-password page instead of the admin panel.
export const resetPasswordEmail = ({ token, name }: { token: string; name?: string | null }) => {
  const url = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`
  return emailLayout({
    title: 'Reset your password',
    body: `
      <p>Hi ${escapeHtml(name || 'there')},</p>
      <p>Someone asked to reset the password for your account. Click the button below to choose a new one. The link expires in 1 hour.</p>
      ${emailButton(url, 'Choose a new password')}
      <p style="font-size:13px;color:#52525b">If you didn't ask for this, you can ignore this email; your password won't change.</p>`,
  })
}
