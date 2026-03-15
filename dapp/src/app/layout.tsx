import type { Metadata } from 'next'
import './globals.css'
import React from 'react'
import { AppProviders } from './context/appProviders'
export const metadata: Metadata = {
  title: 'gibmoni',
  description: 'gib me more moni',
}
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";


import Navbar from '@/components/navbar'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}>
      <body className={`antialiased`}>
        <AppProviders>
          <Navbar />
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
