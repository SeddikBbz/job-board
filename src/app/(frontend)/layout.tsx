import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import React from 'react'

import { RegisterServiceWorker } from '@/components/pwa/register-sw'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import './styles.css'

// Exposed as --font-sans, which the shadcn theme uses
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'JobBoard – Find your next job',
    template: '%s | JobBoard',
  },
  description: 'Browse jobs from great companies and apply in minutes.',
  applicationName: 'JobBoard',
  // Installed on iOS: opens fullscreen with this title
  appleWebApp: { capable: true, title: 'JobBoard', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

// viewport-fit=cover lets the app use the whole screen on notched phones; the header and
// footer add the safe-area insets so nothing hides under the notch or home bar
export const viewport: Viewport = {
  themeColor: '#4f46e5',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      {/* dvh, not vh: mobile browser bars don't push the footer below the screen */}
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:start-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/* flex column so a page can stretch to fill the remaining height with flex-1 */}
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
