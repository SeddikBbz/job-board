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

export const verifyEmailEmail = (args: { to: string; name: string; token: string }): EmailMessage => ({
  to: args.to,
  subject: 'Confirm your email address',
  html: emailLayout({
    title: 'Confirm your email address',
    body: `
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>Please confirm that this is your email address. You need this to apply to jobs, post jobs and upload files.</p>
      ${emailButton(`${siteUrl()}/verify-email?token=${encodeURIComponent(args.token)}`, 'Confirm my email')}
      <p style="font-size:13px;color:#71717a">The link works for 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  }),
})

export const loginCodeEmail = (args: { to: string; name: string; code: string }): EmailMessage => ({
  to: args.to,
  subject: `${args.code} is your sign-in code`,
  html: emailLayout({
    title: 'Sign-in from a new device',
    body: `
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>Someone signed in to your account from a browser or device we haven't seen before. If it was you, enter this code:</p>
      <p style="margin:24px 0;font-size:32px;font-weight:bold;letter-spacing:8px">${escapeHtml(args.code)}</p>
      <p style="font-size:13px;color:#71717a">The code works for 10 minutes. If it wasn't you, change your password now: someone knows it.</p>`,
  }),
})

export const jobToReviewEmail = (args: { to: string; jobTitle: string; companyName: string; flags: string[] }): EmailMessage => ({
  to: args.to,
  subject: `Job to review: ${args.jobTitle}`,
  html: emailLayout({
    title: 'A job is waiting for review',
    body: `
      <p><strong>${escapeHtml(args.jobTitle)}</strong> from ${escapeHtml(args.companyName)} needs a moderator.</p>
      ${args.flags.length ? `<p>Flagged because:</p><ul>${args.flags.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
      ${emailButton(`${siteUrl()}/dashboard/moderation`, 'Open the review queue')}`,
  }),
})

export const jobApprovedEmail = (args: { to: string; name: string; jobTitle: string; slug: string }): EmailMessage => ({
  to: args.to,
  subject: `Your job is live: ${args.jobTitle}`,
  html: emailLayout({
    title: 'Your job was approved',
    body: `
      <p>Hi ${escapeHtml(args.name)},</p>
      <p><strong>${escapeHtml(args.jobTitle)}</strong> is now public and candidates can apply.</p>
      ${emailButton(`${siteUrl()}/jobs/${encodeURIComponent(args.slug)}`, 'View the job')}`,
  }),
})

export const jobRejectedEmail = (args: { to: string; name: string; jobTitle: string; reason: string }): EmailMessage => ({
  to: args.to,
  subject: `Your job needs changes: ${args.jobTitle}`,
  html: emailLayout({
    title: 'Your job was not published',
    body: `
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>A moderator did not publish <strong>${escapeHtml(args.jobTitle)}</strong>, for this reason:</p>
      <p style="padding:12px;background:#f4f4f5;border-radius:8px">${escapeHtml(args.reason)}</p>
      <p>You can edit the job and submit it again.</p>
      ${emailButton(`${siteUrl()}/dashboard/jobs`, 'Edit my jobs')}`,
  }),
})

export const reportActionEmail = (args: { to: string; name: string; jobTitle: string; banned: boolean; note?: string }): EmailMessage => ({
  to: args.to,
  subject: args.banned ? 'Your employer account was suspended' : `Your job was unpublished: ${args.jobTitle}`,
  html: emailLayout({
    title: args.banned ? 'Your account was suspended' : 'Your job was unpublished',
    body: `
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>After reports from users, a moderator ${args.banned ? 'suspended your employer account and closed your jobs' : `unpublished <strong>${escapeHtml(args.jobTitle)}</strong>`}.</p>
      ${args.note ? `<p style="padding:12px;background:#f4f4f5;border-radius:8px">${escapeHtml(args.note)}</p>` : ''}
      <p>If you think this is a mistake, reply to this email.</p>`,
  }),
})
