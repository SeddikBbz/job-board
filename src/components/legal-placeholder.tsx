import { Container } from '@/components/container'

// Temporary page until the real legal texts exist (ROADMAP Class 10, reviewed by a qualified person).
export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <Container className="py-16">
      <div className="max-w-readable">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-4 leading-7">
          This page is being prepared and will be published before the platform opens to the public.
        </p>
      </div>
    </Container>
  )
}
