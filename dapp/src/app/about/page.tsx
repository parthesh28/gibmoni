import Link from 'next/link'

import { PageHeader, SiteFrame } from '@/components/pageFrame'

const highlights = [
  {
    title: 'Escrow-First Funding',
    body: 'Capital is held on-chain and released only after milestone approval, reducing delivery risk for funders.',
  },
  {
    title: 'Milestone Governance',
    body: 'Each stage is voted on by contributors to verify progress before unlocking the next tranche.',
  },
  {
    title: 'Transparent Activity',
    body: 'Projects, votes, and progress are visible through a ledger-first interface with optional metadata enrichment.',
  },
]

export default function AboutPage() {
  return (
    <SiteFrame contentClassName="pt-28 lg:pt-32">
      <PageHeader
        eyebrow="GIBMONI // ABOUT"
        title="About"
        description="GIBMONI is a milestone-based funding protocol on Solana that combines escrowed capital, staged delivery, and community verification."
        actions={<Link href="/dashboard" className="app-secondary">Explore Projects</Link>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item, index) => (
          <article
            key={item.title}
            className="app-surface app-fade-up p-6"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <h2 className="mb-3 font-pixel text-xl uppercase tracking-wider text-zinc-950 dark:text-zinc-50">
              {item.title}
            </h2>
            <p className="app-copy">{item.body}</p>
          </article>
        ))}
      </div>
    </SiteFrame>
  )
}
