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
import { Locations, SkillCategories, Skills } from './collections/Taxonomy'
import { SiteSettings } from './globals/SiteSettings'
import { Reports } from './collections/Reports'
import { Pages } from './collections/Pages'
import { AuditLogs } from './collections/AuditLogs'
import { seedLegalPages, seedTaxonomy } from './lib/taxonomy'
import { Applications } from './collections/Applications'
import { closeExpiredJobsTask, sendEmailTask, purgeAuditLogsTask } from './jobs/tasks'
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
  globals: [SiteSettings],
  collections: [Users, Media, Resumes, Companies, Jobs, Applications, SkillCategories, Skills, Locations, Reports, Pages, AuditLogs],
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
  // Fresh databases (local dev, CI) get their schema from Payload's push, not from migrations,
  // so the starting skills and cities are added here when the list is empty. Production already
  // has them from the taxonomy migration, so this is one quick count there.
  onInit: async (payload) => {
    const { totalDocs } = await payload.count({ collection: 'skills' })
    if (totalDocs === 0) await seedTaxonomy(payload)
    await seedLegalPages(payload)
  },
  jobs: {
    tasks: [sendEmailTask, closeExpiredJobsTask, purgeAuditLogsTask],
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
      // No random suffix: it breaks image sizes (thumbnails get a different name than Payload stores).
      // Resumes get a random file name instead (see Resumes.ts) and are always served through Payload.
      addRandomSuffix: false,
      collections: {
        media: true,
        resumes: true,
      },
    }),
  ],
})
