'use client'

import { ClipboardList, Layers, MousePointerClick, Search, Timer, Users } from 'lucide-react'

import { useAuthRole } from '@/components/auth/auth-role'

const CONTENT = {
  candidate: {
    line: 'Free for candidates. Your resume is only shared with the companies you apply to.',
    benefits: [
      { icon: Search, text: 'Find jobs that fit your skills' },
      { icon: ClipboardList, text: 'Track every application' },
      { icon: MousePointerClick, text: 'Apply in one click' },
    ],
  },
  employer: {
    line: 'Free to post. Review every applicant from one simple dashboard.',
    benefits: [
      { icon: Timer, text: 'Post a job in minutes' },
      { icon: Layers, text: 'Manage applicants in one place' },
      { icon: Users, text: 'Reach qualified candidates' },
    ],
  },
} as const

// Below this, a count reads as "empty" rather than trust-building, so it is hidden
const MIN_JOBS_TO_SHOW = 10

// Brand panel on the right of the auth pages (lg and up). Only real content: no testimonials,
// no invented numbers. The benefits follow the role chosen in the sign-up form.
export function AuthPanel({ openJobs }: { openJobs: number }) {
  const { role } = useAuthRole()
  const content = CONTENT[role]
  return (
    <div className="relative mx-auto w-full max-w-md px-10" data-testid="auth-panel">
      <p className="text-3xl leading-tight font-bold tracking-tight text-balance">Your next career move starts here</p>
      <p className="text-primary-foreground/85 mt-3 leading-7">{content.line}</p>
      <ul className="mt-10 space-y-5" aria-label={role === 'employer' ? 'Benefits for employers' : 'Benefits for candidates'}>
        {content.benefits.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="font-medium">{text}</span>
          </li>
        ))}
      </ul>
      {openJobs >= MIN_JOBS_TO_SHOW && (
        <p className="mt-12 border-t border-white/20 pt-6 text-sm">
          <span className="text-2xl font-bold">{openJobs}</span>{' '}
          <span className="text-primary-foreground/85">open jobs right now</span>
        </p>
      )}
    </div>
  )
}
