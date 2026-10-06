import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mt-2">
        This page doesn&apos;t exist, or the job is no longer available.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/jobs">Browse open jobs</Link>
      </Button>
    </div>
  )
}
