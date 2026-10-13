// First drafts of the legal pages, created once and then edited in the admin panel (Content > Pages).
// DRAFT: structure only, not legal advice. A qualified person must review them under Algerian
// law 18-07 (personal data protection) before the platform opens to the public.
// Fill in every [placeholder].

type Block = { h: string } | { p: string }

const OPERATOR = 'the BCOS online team'
const NOTICE = 'Draft: this page will be reviewed by a qualified person before launch.'

export const LEGAL_PAGES: { slug: string; title: string; blocks: Block[] }[] = [
  {
    slug: 'privacy',
    title: 'Privacy policy',
    blocks: [
      { p: NOTICE },
      { h: 'Who we are' },
      { p: `JobBoard is operated by ${OPERATOR} ([address], Algeria). Contact for any privacy question: [contact email].` },
      { h: 'What we collect' },
      { p: 'Account data: your name, email address, role and password (stored hashed, never in clear).' },
      { p: 'Candidate data: the resumes you upload and the applications you send, including any cover letter.' },
      { p: 'Employer data: company profile, logo and the jobs you post.' },
      { p: 'Security data: a random identifier for each browser you sign in from (to recognise trusted devices), and technical logs needed to protect the platform against abuse.' },
      { h: 'Why we use it' },
      { p: 'To run the job board: show jobs, send your applications to the employers you choose, and email you about your account and applications. To keep the platform safe: email verification, new-device sign-in codes, spam checks and reports.' },
      { h: 'Who can see your data' },
      { p: 'Your resume is only visible to the employers of the jobs you apply to, and to platform administrators when needed to handle a report. We do not sell personal data.' },
      { h: 'How long we keep it' },
      { p: 'You decide: you can delete your resumes at any time from your dashboard, and the file is deleted. To keep a record of what happened on the platform (traceability), we keep a short log entry (who, when, which file name) for the period set by the platform, [retention period], in line with Algerian law. The content of a deleted resume is never kept.' },
      { h: 'Your rights' },
      { p: 'Under law 18-07 you can ask to access, correct or delete your personal data, and object to its processing. Write to [contact email]. You can also contact the national authority for the protection of personal data (ANPDP).' },
      { h: 'Changes' },
      { p: 'If this policy changes in an important way, we will tell you by email or on the site.' },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of use',
    blocks: [
      { p: NOTICE },
      { h: 'The service' },
      { p: `JobBoard, operated by ${OPERATOR}, lets companies publish job offers and candidates apply to them.` },
      { h: 'Your account' },
      { p: 'Give accurate information, keep your password private and confirm your email address. You are responsible for what is done with your account.' },
      { h: 'Rules for employers' },
      { p: 'Job offers must be real, legal and non-discriminatory. Never ask candidates for money, fees or bank details. Jobs may be reviewed before they are published, and can be removed if they break these rules.' },
      { h: 'Rules for candidates' },
      { p: 'Apply only with your own, truthful information. Do not upload files that contain someone else’s personal data without permission.' },
      { h: 'Reports and moderation' },
      { p: 'Anyone can report a job. Moderators may unpublish jobs and suspend accounts that break these terms.' },
      { h: 'Liability' },
      { p: 'We connect candidates and employers but are not a party to any hiring decision or employment contract. [Liability terms to be completed.]' },
      { h: 'Contact' },
      { p: 'Questions about these terms: [contact email].' },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie policy',
    blocks: [
      { p: NOTICE },
      { h: 'Only essential cookies' },
      { p: 'We only use cookies that the site needs to work, so we do not ask for consent:' },
      { p: 'Sign-in cookie (payload-token): keeps you logged in.' },
      { p: 'Trusted browser cookie (jb_device): a random identifier used to recognise browsers you have signed in from, so we can ask for a code on new ones.' },
      { p: 'Human check (Cloudflare Turnstile): protects sign-in and forms from bots.' },
      { p: 'We do not use advertising or tracking cookies. If this changes, we will ask for your consent first.' },
    ],
  },
]

const text = (value: string) => ({ type: 'text', version: 1, text: value, format: 0, style: '', mode: 'normal', detail: 0 })
const base = { version: 1, direction: 'ltr' as const, format: '' as const, indent: 0 }

// Builds Lexical rich text (headings and paragraphs) from the blocks above
export const blocksToRichText = (blocks: Block[]) => ({
  root: {
    type: 'root',
    ...base,
    children: blocks.map((b) =>
      'h' in b ? { type: 'heading', tag: 'h2', ...base, children: [text(b.h)] } : { type: 'paragraph', textFormat: 0, ...base, children: [text(b.p)] },
    ),
  },
})
