import type { Metadata } from 'next'
import './globals.css'
import React from 'react'
import { AppProviders } from './context/appProviders'
import { ThemeSelect } from '@/components/themeSelect'
import Navbar from '@/components/navbar'
export const metadata: Metadata = {
  title: 'gibmoni',
  description: 'gib me more moni',
}

const links: { label: string; path: string }[] = [
  // More links...
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
]

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AppProviders>
          <Navbar />
          <ThemeSelect />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
