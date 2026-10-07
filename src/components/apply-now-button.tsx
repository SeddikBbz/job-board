'use client'

import { Button } from '@/components/ui/button'

// Jumps to the #apply section. When the page is short, the section is already on screen and a
// plain anchor link does nothing visible, so we also highlight it and move focus into it.
export function ApplyNowButton() {
  return (
    <Button size="lg" asChild>
      <a
        href="#apply"
        onClick={(event) => {
          const section = document.getElementById('apply')
          if (!section) return
          event.preventDefault()
          history.replaceState(null, '', '#apply')
          section.scrollIntoView({ behavior: 'smooth', block: 'center' })

          const target = section.querySelector<HTMLElement>('input:not([type=hidden]), textarea, button, a[href]')
          target?.focus({ preventScroll: true })

          section.classList.add('ring-primary', 'ring-2', 'ring-offset-4', 'rounded-xl')
          setTimeout(() => section.classList.remove('ring-primary', 'ring-2', 'ring-offset-4'), 1500)
        }}
      >
        Apply now
      </a>
    </Button>
  )
}
