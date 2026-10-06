import { APIError, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminOrOwner } from '@/access/isAdminOrOwner'
import { isCandidate } from '@/access/isCandidate'
import { ownerField } from '@/fields/owner'
import { setOwner } from '@/hooks/setOwner'

const MAX_RESUME_BYTES = 5 * 1024 * 1024

// Payload only has a global upload size limit, so the 5 MB rule is checked here.
// We measure the buffer: for non-image files Payload replaces req.file before hooks run
// and `req.file.size` ends up undefined.
const limitFileSize: CollectionBeforeValidateHook = ({ data, req }) => {
  const size = req.file?.data?.length || req.file?.size || 0
  if (size > MAX_RESUME_BYTES) {
    throw new APIError('Resume must be 5 MB or smaller.', 400, undefined, true)
  }
  return data
}

// Private PDFs. Files are served through Payload (/api/resumes/file/...) so access control applies.
export const Resumes: CollectionConfig = {
  slug: 'resumes',
  access: {
    // TODO(M8): also let employers read resumes attached to applications for their own jobs
    read: isAdminOrOwner,
    create: isCandidate,
    update: () => false,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [limitFileSize],
    beforeChange: [setOwner],
  },
  fields: [ownerField],
  upload: {
    mimeTypes: ['application/pdf'],
  },
}
