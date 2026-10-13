import type { TaskConfig } from 'payload'

type SendEmailIO = { input: { to: string; subject: string; html: string }; output: object }

// Sends one email. Retried up to 3 times if the provider fails.
export const sendEmailTask: TaskConfig<SendEmailIO> = {
  slug: 'sendEmail',
  retries: 3,
  inputSchema: [
    { name: 'to', type: 'email', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'html', type: 'textarea', required: true },
  ],
  handler: async ({ input, req }) => {
    await req.payload.sendEmail({ to: input.to, subject: input.subject, html: input.html })
    return { output: {} }
  },
}

type CloseExpiredIO = { input: object; output: { closed: number } }

// Closes published jobs whose expiry date has passed. Public pages already hide expired
// jobs (read access); this keeps their status accurate for employers and admins.
export const closeExpiredJobsTask: TaskConfig<CloseExpiredIO> = {
  slug: 'closeExpiredJobs',
  // Daily at 03:00 UTC (Vercel's free plan allows daily crons). Format: sec min hour day month weekday
  schedule: [{ cron: '0 0 3 * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const result = await req.payload.update({
      collection: 'jobs',
      where: {
        and: [{ status: { equals: 'published' } }, { expiresAt: { less_than_equal: new Date().toISOString() } }],
      },
      data: { status: 'closed' },
      req,
    })
    return { output: { closed: result.docs.length } }
  },
}

type PurgeIO = { input: object; output: { deleted: number } }

// Deletes traceability records older than the retention period set in Site settings
export const purgeAuditLogsTask: TaskConfig<PurgeIO> = {
  slug: 'purgeAuditLogs',
  schedule: [{ cron: '0 30 3 * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req }).catch(() => null)
    const days = settings?.privacy?.auditLogRetentionDays ?? 1095
    const before = new Date(Date.now() - days * 86_400_000).toISOString()
    const result = await req.payload.delete({ collection: 'audit-logs', where: { createdAt: { less_than: before } }, overrideAccess: true, req })
    return { output: { deleted: result.docs.length } }
  },
}
