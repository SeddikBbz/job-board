import type { CollectionSlug, Payload } from 'payload'

// Hooks that would send emails or touch the Next.js cache are skipped in tests
export const testContext = { disableEmails: true, disableRevalidate: true }

export const richText = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        children: [{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }],
      },
    ],
  },
})

// Smallest valid one-page PDF (Payload checks that uploaded PDFs are real PDFs)
export const pdfFile = (name = 'cv.pdf') => {
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>',
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
  const data = Buffer.from(pdf)
  return { data, name, mimetype: 'application/pdf', size: data.length }
}

export const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

// Deletes every document created by users whose email ends with `domain`, children first.
export async function deleteTestData(payload: Payload, domain: string) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { like: domain } },
    pagination: false,
    depth: 0,
  })
  const ids = docs.map((u) => u.id)
  if (!ids.length) return

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
      context: testContext,
    })
    const docIds = found.docs.map((d) => d.id)
    if (docIds.length) {
      await payload.delete({ collection, where: { id: { in: docIds } }, context: testContext })
    }
  }
}
