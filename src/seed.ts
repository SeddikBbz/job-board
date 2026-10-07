/**
 * Seeds the database with realistic demo data.
 *
 *   pnpm seed          create data (does nothing if already seeded)
 *   pnpm seed:reset    delete all seed data, then create it again
 *
 * Seed users have @seed.local emails and the password from SEED_PASSWORD (default "password123").
 * Runs with the Local API as trusted server code (no user, so access control is bypassed on purpose).
 */
import config from '@payload-config'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import sharp from 'sharp'

import type { Job, User } from './payload-types'

const DOMAIN = '@seed.local'
const PASSWORD = process.env.SEED_PASSWORD || 'password123'
const context = { disableRevalidate: true, skipRoleProtection: true, disableEmails: true }

// ---------- deterministic random helpers ----------
let state = 42
const random = () => {
  // mulberry32: same data on every run
  state = (state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]
const pickMany = <T>(list: readonly T[], count: number): T[] =>
  [...list].sort(() => random() - 0.5).slice(0, count)
const between = (min: number, max: number) => Math.floor(min + random() * (max - min + 1))
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

// ---------- file builders ----------
const richText = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      textFormat: 0,
      children: [{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }],
    })),
  },
})

const logoPng = (initials: string, color: string) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" rx="48" fill="${color}"/>
        <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="96" font-weight="700"
          fill="#fff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
      </svg>`,
    ),
  )
    .png()
    .toBuffer()

// Smallest valid one-page PDF with a line of text (byte offsets in the xref table must be exact)
const resumePdf = (name: string) => {
  const text = `BT /F1 18 Tf 40 760 Td (Resume - ${name}) Tj ET`
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${text.length}>>\nstream\n${text}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((body, i) => {
    const offset = pdf.length
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
    return offset
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf)
}

const file = (data: Buffer, name: string, mimetype: string) => ({ data, name, mimetype, size: data.length })

// ---------- demo content ----------
const COMPANIES = [
  { name: 'Atlas Digital', location: 'Algiers', size: '51-200', color: '#2563eb', web: 'atlas-digital.example' },
  { name: 'Sahara Logistics', location: 'Oran', size: '201-1000', color: '#d97706', web: 'sahara-logistics.example' },
  { name: 'Numidia Health', location: 'Constantine', size: '11-50', color: '#059669', web: 'numidia-health.example' },
  { name: 'Casbah Labs', location: 'Algiers', size: '1-10', color: '#7c3aed', web: 'casbah-labs.example' },
  { name: 'Méditerranée Finance', location: 'Paris', size: '1000+', color: '#0f766e', web: 'medfinance.example' },
  { name: 'Hoggar Energy', location: 'Hassi Messaoud', size: '1000+', color: '#dc2626', web: 'hoggar-energy.example' },
  { name: 'Kabylie Studio', location: 'Tizi Ouzou', size: '11-50', color: '#db2777', web: 'kabylie-studio.example' },
  { name: 'Tassili Cloud', location: 'Remote', size: '51-200', color: '#0891b2', web: 'tassili-cloud.example' },
] as const

const ROLES = [
  { title: 'Frontend Developer', skills: ['react', 'typescript', 'nextjs', 'tailwind', 'css'] },
  { title: 'Backend Developer', skills: ['node', 'postgresql', 'typescript', 'docker', 'rest'] },
  { title: 'Full-Stack Engineer', skills: ['react', 'node', 'postgresql', 'nextjs', 'graphql'] },
  { title: 'Mobile Developer', skills: ['react-native', 'flutter', 'kotlin', 'swift'] },
  { title: 'DevOps Engineer', skills: ['docker', 'kubernetes', 'aws', 'terraform', 'ci-cd'] },
  { title: 'Data Analyst', skills: ['sql', 'python', 'power-bi', 'excel'] },
  { title: 'Data Scientist', skills: ['python', 'machine-learning', 'pandas', 'sql'] },
  { title: 'UI/UX Designer', skills: ['figma', 'user-research', 'prototyping', 'design-systems'] },
  { title: 'QA Engineer', skills: ['playwright', 'cypress', 'test-automation', 'jira'] },
  { title: 'Product Manager', skills: ['roadmapping', 'agile', 'analytics', 'communication'] },
  { title: 'Accountant', skills: ['accounting', 'excel', 'sage', 'reporting'] },
  { title: 'Sales Representative', skills: ['b2b-sales', 'crm', 'negotiation', 'french'] },
] as const

const LEVELS = ['Junior', '', 'Senior', 'Lead'] as const
const JOB_TYPES = ['full-time', 'full-time', 'full-time', 'part-time', 'contract', 'internship'] as const
const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const
const FIRST_NAMES = ['Amine', 'Lina', 'Yacine', 'Sara', 'Karim', 'Nour', 'Rayan', 'Imane', 'Walid', 'Meriem']
const LAST_NAMES = ['Benali', 'Haddad', 'Mansouri', 'Brahimi', 'Khelifi', 'Zerrouki', 'Saidi', 'Belkacem']
const APPLICATION_STATUSES = ['applied', 'applied', 'reviewing', 'interview', 'rejected', 'hired'] as const

// ---------- reset ----------
async function reset(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { like: DOMAIN } },
    pagination: false,
    depth: 0,
  })
  const ids = docs.map((u) => u.id)
  if (ids.length === 0) return

  // Children first so relationships don't block deletes
  const plan: [CollectionSlug, string][] = [
    ['applications', 'candidate'],
    ['jobs', 'company.owner'],
    ['companies', 'owner'],
    ['media', 'owner'],
    ['resumes', 'owner'],
    ['users', 'id'],
  ]
  for (const [collection, field] of plan) {
    const found = await payload.find({
      collection,
      where: { [field]: { in: ids } },
      pagination: false,
      depth: 0,
      context,
    })
    const docIds = found.docs.map((d) => d.id)
    if (docIds.length) await payload.delete({ collection, where: { id: { in: docIds } }, context })
    payload.logger.info(`Reset: deleted ${docIds.length} ${collection}`)
  }
}

// ---------- seed ----------
async function seed(payload: Payload) {
  const createUser = (email: string, name: string, role: User['role']) =>
    payload.create({
      collection: 'users',
      data: { email: email + DOMAIN, name, role, password: PASSWORD },
      context,
    })

  await createUser('admin', 'Seed Admin', 'admin')
  const employers = await Promise.all(
    ['Nadia Recruiter', 'Omar Hiring', 'Selma Talent'].map((name, i) =>
      createUser(`employer${i + 1}`, name, 'employer'),
    ),
  )
  const candidates: User[] = []
  for (let i = 0; i < 10; i++) {
    const name = `${FIRST_NAMES[i]} ${pick(LAST_NAMES)}`
    candidates.push(await createUser(`candidate${i + 1}`, name, 'candidate'))
  }
  payload.logger.info(`Seeded ${1 + employers.length + candidates.length} users`)

  // Companies (admins are not limited to one company, and neither is the seed)
  const companies = []
  for (const [i, c] of COMPANIES.entries()) {
    const owner = employers[i % employers.length]
    const initials = c.name
      .split(' ')
      .map((w) => w[0])
      .join('')
    const logo = await payload.create({
      collection: 'media',
      data: { alt: `${c.name} logo`, owner: owner.id },
      file: file(await logoPng(initials, c.color), `${initials.toLowerCase()}-logo.png`, 'image/png'),
      context,
    })
    companies.push(
      await payload.create({
        collection: 'companies',
        data: {
          name: c.name,
          location: c.location,
          size: c.size,
          website: `https://${c.web}`,
          description: `${c.name} is a ${c.size}-person company based in ${c.location}, hiring across engineering, data and business teams.`,
          logo: logo.id,
          owner: owner.id,
        },
        context,
      }),
    )
  }
  payload.logger.info(`Seeded ${companies.length} companies`)

  // 40 jobs: 32 published, 5 drafts, 3 closed
  const jobs: Job[] = []
  for (let i = 0; i < 40; i++) {
    const company = companies[i % companies.length]
    const role = pick(ROLES)
    const level = pick(LEVELS)
    const workMode = company.location === 'Remote' ? 'remote' : pick(WORK_MODES)
    const status = i < 32 ? 'published' : i < 37 ? 'draft' : 'closed'
    const inEurope = company.location === 'Paris'
    const salaryMin = inEurope ? between(35, 60) * 1000 : between(80, 250) * 1000
    const title = [level, role.title].filter(Boolean).join(' ')

    jobs.push(
      await payload.create({
        collection: 'jobs',
        data: {
          title,
          company: company.id,
          description: richText(
            `${company.name} is looking for a ${title} to join the team in ${company.location}.`,
            `You will work with ${pickMany(role.skills, 2).join(' and ')} on products used by thousands of people.`,
            'We offer a friendly team, training budget and flexible hours.',
          ),
          location: workMode === 'remote' ? 'Remote' : company.location,
          jobType: pick(JOB_TYPES),
          workMode,
          salaryMin,
          salaryMax: salaryMin + (inEurope ? between(5, 20) * 1000 : between(20, 100) * 1000),
          salaryCurrency: inEurope ? 'EUR' : 'DZD',
          skills: pickMany(role.skills, between(2, 4)),
          status,
          // Spread publish dates over the last 30 days so "latest jobs" looks realistic
          publishedAt: status === 'draft' ? undefined : daysFromNow(-between(0, 30)),
          expiresAt: daysFromNow(between(10, 60)),
        },
        context,
      }),
    )
  }
  payload.logger.info(`Seeded ${jobs.length} jobs`)

  // One resume per candidate, then 30 unique (candidate, job) applications on published jobs
  const resumes = []
  for (const candidate of candidates) {
    resumes.push(
      await payload.create({
        collection: 'resumes',
        data: { owner: candidate.id },
        file: file(resumePdf(candidate.name), `${candidate.name.replace(/\s+/g, '-').toLowerCase()}-cv.pdf`, 'application/pdf'),
        context,
      }),
    )
  }

  const publishedJobs = jobs.filter((j) => j.status === 'published')
  const pairs = new Set<string>()
  while (pairs.size < 30) {
    pairs.add(`${between(0, candidates.length - 1)}:${between(0, publishedJobs.length - 1)}`)
  }
  for (const pair of pairs) {
    const [c, j] = pair.split(':').map(Number)
    await payload.create({
      collection: 'applications',
      data: {
        job: publishedJobs[j].id,
        candidate: candidates[c].id,
        resume: resumes[c].id,
        coverLetter: `Hello, I am ${candidates[c].name} and I am very interested in the ${publishedJobs[j].title} role.`,
        status: pick(APPLICATION_STATUSES),
      },
      context,
    })
  }
  payload.logger.info(`Seeded ${resumes.length} resumes and ${pairs.size} applications`)
}

// ---------- main ----------
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}

const payload = await getPayload({ config })

// `payload run` drops --flags, so reset is passed as an env var (see the seed:reset script)
if (process.env.SEED_RESET === '1') {
  await reset(payload)
} else {
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: { email: { equals: `admin${DOMAIN}` } },
  })
  if (totalDocs > 0) {
    payload.logger.info('Already seeded. Run `pnpm seed:reset` to start over.')
    process.exit(0)
  }
}

await seed(payload)
payload.logger.info(`Done. Log in with any @seed.local user, password: ${PASSWORD === 'password123' ? PASSWORD : '(SEED_PASSWORD)'}`)
process.exit(0)
