// Centered card for login, register and password pages
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex max-w-md flex-col px-4 py-12 sm:py-20">
      <div className="bg-card rounded-2xl border p-6 shadow-sm sm:p-8">{children}</div>
    </div>
  )
}
