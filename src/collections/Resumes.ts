import { APIError, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { canReadResumes } from '@/access/applications'
import { isCandidate } from '@/access/isCandidate'
import { ownerField } from '@/fields/owner'
import { setOwner } from '@/hooks/setOwner'
import { MAX_RESUME_BYTES, MAX_RESUME_MB } from '@/lib/validation/application'

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

// Private PDFs. Files are served through Payload (/api/resumes/file/...) so access control applies.
export const Resumes: CollectionConfig = {
  slug: 'resumes',
  access: {
    read: canReadResumes,
    create: isCandidate,
    update: () => false,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [limitFileSize, setOwner],
  },
  fields: [ownerField],
  upload: {
    mimeTypes: ['application/pdf'],
  },
}
