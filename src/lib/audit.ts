import type { PayloadRequest } from 'payload'

type Entry = { action: string; collection?: string; documentId?: string | number; summary?: string }

// Records a traceability entry. Never throws: a failed log must not break the user's action.
export async function audit(req: PayloadRequest, entry: Entry) {
  try {
    await req.payload.create({
      collection: 'audit-logs',
      data: { ...entry, documentId: entry.documentId?.toString(), actor: req.user?.id },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'audit log failed' })
  }
}
