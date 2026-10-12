'use client'

import { createContext, useContext, useTransition } from 'react'

import { cn } from '@/lib/utils'

type TransitionState = { isPending: boolean; startTransition: (callback: () => void) => void }

const Context = createContext<TransitionState>({ isPending: false, startTransition: (cb) => cb() })

// One shared transition for the search box, the filters and the results: while the URL change
// re-renders the list on the server, the old results stay visible but dimmed.
export function SearchTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()
  return <Context.Provider value={{ isPending, startTransition }}>{children}</Context.Provider>
}

export const useSearchTransition = () => useContext(Context)

export function PendingResults({ children }: { children: React.ReactNode }) {
  const { isPending } = useSearchTransition()
  return (
    <div aria-busy={isPending} className={cn('transition-opacity', isPending && 'pointer-events-none opacity-50')}>
      {children}
    </div>
  )
}
