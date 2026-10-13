import { randomUUID } from 'crypto'
import {
  APIError,
  type CollectionAfterDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from 'payload'

import { canReadResumes } from '@/access/applications'
import { ownerField } from '@/fields/owner'
import { setOwner } from '@/hooks/setOwner'
import { MAX_RESUME_BYTES, MAX_RESUME_MB } from '@/lib/validation/application'
import { isVerifiedCandidate } from '@/access/isVerified'
import { isAdminOrOwner } from '@/access/isAdminOrOwner'
import { audit } from '@/lib/audit'

// Payload only has a global upload size limit, so the resume size rule is checked here.
// We measure the buffer: for non-image files Payload replaces req.file before hooks run
// and `req.file.size` ends up undefined.
const limitFileSize: CollectionBeforeValidateHook = ({ data, req }) => {
  const size = req.file?.data?.length || req.file?.size || 0
  if (size > MAX_RESUME_BYTES) {
    throw new APIError(`Resume must be ${MAX_RESUME_MB} MB or smaller.`, 400, undefined, true)
  }
  return data
}

// Store every resume under a random name: the Blob store is public, so file names must be
// unguessable, and the candidate's original file name (often their full name) isn't kept.
const randomFileName: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation === 'create' && req.file) req.file.name = `${randomUUID()}.pdf`
  return args
}

// The file is gone; only who/when/which file is kept, for traceability (never the CV itself)
const logResumeDeletion: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await audit(req, {
    action: 'resume.deleted',
    collection: 'resumes',
    documentId: doc.id,
    summary: `${doc.filename ?? 'resume'} (${doc.filesize ?? 0} bytes), owner ${typeof doc.owner === 'object' ? doc.owner?.id : doc.owner}`,
  })
}

// Private PDFs. Files are served through Payload (/api/resumes/file/...) so access control applies.
export const Resumes: CollectionConfig = {
  slug: 'resumes',
  access: {
    read: canReadResumes,
    create: isVerifiedCandidate,
    update: () => false,
    // Candidates control their data: they can delete their own resumes at any time
    delete: isAdminOrOwner,
  },
  hooks: {
    beforeOperation: [randomFileName],
    beforeValidate: [limitFileSize, setOwner],
    afterDelete: [logResumeDeletion],
  },
  fields: [ownerField],
  upload: {
    mimeTypes: ['application/pdf'],
  },
}
