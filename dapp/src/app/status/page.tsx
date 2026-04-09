import Link from 'next/link'

import { SiteFrame, PageHeader } from '@/components/pageFrame'

const services = [
  { name: 'Solana Ledger', state: 'Operational' },
  { name: 'Metadata API', state: 'Operational' },
  { name: 'Theme System', state: 'Operational' },
  { name: 'Project Routing', state: 'Operational' },
]

export default function StatusPage() {
  return (
    <SiteFrame contentClassName="pt-28 lg:pt-32">
      <PageHeader
        eyebrow="SYSTEM // STATUS"
        title="Status"
        description="Live product surfaces and their current application state. Use this page to confirm the core routes and services are available."
        actions={<Link href="/dashboard" className="app-secondary">Back to Explore</Link>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <div key={service.name} className="app-surface flex items-center justify-between p-5">
            <div>
              <div className="font-pixel text-lg uppercase tracking-wider text-zinc-950 dark:text-zinc-50">{service.name}</div>
              <div className="app-eyebrow mt-1">SERVICE</div>
            </div>
            <span className="border border-[#ea580c] bg-[#ea580c] px-3 py-1 font-mono text-[10px] tracking-widest uppercase text-white">
              {service.state}
            </span>
          </div>
        ))}
      </div>
    </SiteFrame>
  )
}
