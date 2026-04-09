import React from 'react'

import { cn } from '@/lib/utils'

type SiteFrameProps = {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function SiteFrame({ children, className, contentClassName }: SiteFrameProps) {
  return (
    <main
      className={cn(
        'relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(234,88,12,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(234,88,12,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-25"
      />
      <div className={cn('relative mx-auto w-full max-w-7xl px-6 py-12 lg:px-12 lg:py-14', contentClassName)}>{children}</div>
    </main>
  )
}

type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#ea580c] shadow-[0_0_18px_rgba(234,88,12,0.65)]" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400">{eyebrow}</span>
        </div>
        <h1 className="font-pixel text-3xl uppercase tracking-wider text-zinc-950 dark:text-zinc-50 sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}