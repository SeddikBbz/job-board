import { after } from 'next/server'
import type { PayloadRequest } from 'payload'

import type { EmailMessage } from './templates'

// Puts the email in Payload's jobs queue (so a failing email never breaks the request),
// then runs that job right after the response is sent. Anything still queued (e.g. after
// a failure) is picked up by the cron that calls /api/payload-jobs/run.
export async function queueEmail(req: PayloadRequest, message: EmailMessage) {
  const job = await req.payload.jobs.queue({ task: 'sendEmail', input: message, req })
  try {
    after(async () => {
      await req.payload.jobs.runByID({ id: job.id })
    })
  } catch {
    // after() only works inside a Next.js request (not in scripts); the cron will send it
  }
}
