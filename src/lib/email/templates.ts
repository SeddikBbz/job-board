import { emailButton, emailLayout, escapeHtml, siteUrl } from './layout'

export type EmailMessage = { to: string; subject: string; html: string }

const STATUS_TEXT: Record<string, string> = {
  applied: 'has been received',
  reviewing: 'is being reviewed',
  interview: 'has moved to the interview stage',
  rejected: 'was not selected this time',
  hired: 'was successful. Congratulations!',
}

export const applicationReceivedEmail = (args: {
  to: string
  candidateName: string
  jobTitle: string
  companyName: string
}): EmailMessage => ({
  to: args.to,
  subject: `Application received: ${args.jobTitle}`,
  html: emailLayout({
    title: 'We received your application',
    body: `
      <p>Hi ${escapeHtml(args.candidateName)},</p>
      <p>Your application for <strong>${escapeHtml(args.jobTitle)}</strong> at ${escapeHtml(args.companyName)} was sent. We'll email you when its status changes.</p>
      ${emailButton(`${siteUrl()}/dashboard/applications`, 'Track your applications')}`,
  }),
})

export const newApplicantEmail = (args: {
  to: string
  employerName: string
  candidateName: string
  jobTitle: string
  jobId: number
}): EmailMessage => ({
  to: args.to,
  subject: `New applicant for ${args.jobTitle}`,
  html: emailLayout({
    title: 'You have a new applicant',
    body: `
      <p>Hi ${escapeHtml(args.employerName)},</p>
      <p><strong>${escapeHtml(args.candidateName)}</strong> applied to <strong>${escapeHtml(args.jobTitle)}</strong>.</p>
      ${emailButton(`${siteUrl()}/dashboard/jobs/${args.jobId}/applicants`, 'Review applicants')}`,
  }),
})

export const statusChangedEmail = (args: {
  to: string
  candidateName: string
  jobTitle: string
  companyName: string
  status: string
}): EmailMessage => ({
  to: args.to,
  subject: `Update on your application: ${args.jobTitle}`,
  html: emailLayout({
    title: 'Your application was updated',
    body: `
      <p>Hi ${escapeHtml(args.candidateName)},</p>
      <p>Your application for <strong>${escapeHtml(args.jobTitle)}</strong> at ${escapeHtml(args.companyName)} ${escapeHtml(STATUS_TEXT[args.status] ?? `is now "${args.status}"`)}.</p>
      ${emailButton(`${siteUrl()}/dashboard/applications`, 'View your applications')}`,
  }),
})

export const applicationWithdrawnEmail = (args: {
  to: string
  employerName: string
  candidateName: string
  jobTitle: string
  jobId: number
}): EmailMessage => ({
  to: args.to,
  subject: `Application withdrawn: ${args.jobTitle}`,
  html: emailLayout({
    title: 'An applicant withdrew',
    body: `
      <p>Hi ${escapeHtml(args.employerName)},</p>
      <p>${escapeHtml(args.candidateName)} withdrew their application for <strong>${escapeHtml(args.jobTitle)}</strong>.</p>
      ${emailButton(`${siteUrl()}/dashboard/jobs/${args.jobId}/applicants`, 'View applicants')}`,
  }),
})
