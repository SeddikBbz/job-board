import { CheckCircle2 } from 'lucide-react'

const BENEFITS = [
  'Apply to any job in two minutes with one resume',
  'Track every application and its status in one place',
  'Employers: post jobs and review applicants for free',
]

// Split screen for login, register and password pages: form on the left, brand panel on the right
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <div className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:flex lg:items-center">
        <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5 blur-2xl" />
        <div className="relative mx-auto max-w-md px-10">
          <p className="text-sm font-semibold tracking-wide text-white/70 uppercase">JobBoard</p>
          <p className="mt-4 text-3xl leading-tight font-bold tracking-tight">
            Your next opportunity is one application away.
          </p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-white/90">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <p className="mt-12 rounded-2xl bg-white/10 p-6 leading-7 text-white/90 ring-1 ring-white/15">
            Free for candidates. Your resume is private: only the companies you apply to can see it.
          </p>
        </div>
      </div>
    </div>
  )
}
