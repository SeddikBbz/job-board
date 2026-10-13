import { APIError, type CollectionBeforeOperationHook, type CollectionConfig, type ImageUploadFormatOptions } from 'payload'
import sharp from 'sharp'

import { isAdminOrOwner } from '@/access/isAdminOrOwner'
import { ownerField } from '@/fields/owner'
import { setOwner } from '@/hooks/setOwner'
import { ACCEPTED_IMAGE_TYPES, checkImage, MAX_IMAGE_SIDE } from '@/lib/validation/media'
import { isVerifiedUser } from '@/access/isVerified'

// WebP is much smaller than JPEG/PNG and keeps transparency (logos)
const webp: ImageUploadFormatOptions = { format: 'webp', options: { quality: 80 } }

// Friendly errors before Payload processes the file. Payload's own size limit only covers
// REST uploads, and our uploads come through Server Actions (Local API).
const checkUploadedImage: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) return args
  const { data, mimetype } = req.file
  // Read only the header: never decode a possibly huge bitmap here
  const meta = await sharp(data, { limitInputPixels: false })
    .metadata()
    .catch(() => null)
  const error =
    checkImage({ type: mimetype, size: data.length, width: meta?.width, height: meta?.height }) ??
    (meta ? null : 'This file is not a valid image.')
  if (error) throw new APIError(error, 400, undefined, true)
  return args
}

// Public images: company logos, avatars and covers.
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    // Uploading needs a confirmed email
    create: isVerifiedUser,
    update: isAdminOrOwner,
    delete: isAdminOrOwner,
  },
  hooks: {
    beforeOperation: [checkUploadedImage],
    beforeValidate: [setOwner],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'other',
      options: ['avatar', 'logo', 'cover', 'other'],
      admin: { position: 'sidebar' },
    },
    // Acts as "uploadedBy": set by the setOwner hook, used by the update/delete access rule
    ownerField,
  ],
  upload: {
    mimeTypes: ACCEPTED_IMAGE_TYPES,
    adminThumbnail: 'thumb',
    focalPoint: true,
    crop: true,
    // Original: longest side at most 2400 px, never enlarged. EXIF rotation is applied and
    // metadata is dropped by Payload (withMetadata is not set).
    resizeOptions: {
      width: MAX_IMAGE_SIDE,
      height: MAX_IMAGE_SIDE,
      fit: 'inside',
      withoutEnlargement: true,
    },
    formatOptions: webp,
    // Sizes larger than the original are skipped by Payload; components fall back to the original.
    imageSizes: [
      { name: 'thumb', width: 160, height: 160, fit: 'cover', formatOptions: webp },
      { name: 'avatar', width: 400, height: 400, fit: 'cover', formatOptions: webp },
      // Logos are never cropped and keep their transparent background
      { name: 'logo', width: 400, height: 200, fit: 'inside', formatOptions: webp },
      { name: 'card', width: 640, fit: 'inside', formatOptions: webp },
      { name: 'hero', width: 1600, fit: 'inside', formatOptions: webp },
      { name: 'og', width: 1200, height: 630, fit: 'cover', formatOptions: webp },
    ],
  },
}
