import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { checkRole } from './access/checkRole'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Resumes } from './collections/Resumes'
import { Companies } from './collections/Companies'
import { Jobs } from './collections/Jobs'
import { Applications } from './collections/Applications'
import { closeExpiredJobsTask, sendEmailTask } from './jobs/tasks'
import { emailAdapter } from './lib/email/adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Resumes, Companies, Jobs, Applications],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  email: emailAdapter(),
  jobs: {
    tasks: [sendEmailTask, closeExpiredJobsTask],
    access: {
      // GET /api/payload-jobs/run is called by Vercel Cron, which sends
      // "Authorization: Bearer <CRON_SECRET>". Admins may also trigger it.
      run: ({ req }) => {
        if (checkRole(req.user, ['admin'])) return true
        const secret = process.env.CRON_SECRET
        return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
  },
  sharp,
  plugins: [
    // Without a token (local dev) the plugin is disabled and files are stored on local disk.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Keep the DB schema identical whether or not the plugin is enabled
      alwaysInsertFields: true,
      // Blob URLs are public, so make them unguessable; resumes are still served through Payload
      addRandomSuffix: true,
      collections: {
        media: true,
        resumes: true,
      },
    }),
  ],
})
