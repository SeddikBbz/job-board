import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'

import { Container } from '@/components/container'
import { formatDate } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'

// Renders a page edited in the admin panel (Content > Pages)
export async function LegalPage({ slug }: { slug: string }) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, overrideAccess: false })
  const page = docs[0]
  if (!page) notFound()
  return (
    <Container className="py-16">
      <article className="max-w-readable space-y-4 leading-7 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        <p className="text-muted-foreground text-sm">Last updated {formatDate(page.updatedAt)}</p>
        <RichText data={page.content} />
      </article>
    </Container>
  )
}
