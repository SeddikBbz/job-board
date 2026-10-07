'use client'

import { SlidersHorizontal } from 'lucide-react'

import { JobFilters } from '@/components/job-filters'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// On small screens the filters live in a slide-in panel instead of the sidebar.
// The panel content only mounts when open, so the inputs never exist twice on the page.
export function MobileFilters() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="md:hidden">
          <SlidersHorizontal aria-hidden /> Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter jobs</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <JobFilters />
        </div>
      </SheetContent>
    </Sheet>
  )
}
