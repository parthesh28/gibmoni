import Link from 'next/link'

import { SiteFrame, PageHeader } from '@/components/pageFrame'

const sections = [
  {
    title: 'Data We Collect',
    body: 'We store wallet addresses, project metadata, and the profile information you choose to publish so the protocol can render activity and ownership correctly.',
  },
  {
    title: 'How It Is Used',
    body: 'On-chain data is used to power the project ledger, milestone state, and wallet-based permissions. Off-chain metadata improves discoverability and profile pages.',
  },
  {
    title: 'Your Controls',
    body: 'You can disconnect your wallet at any time, and you can update or delete off-chain profile data through the app backend where supported.',
  },
]

export default function PrivacyPage() {
  return (
    <SiteFrame contentClassName="pt-28 lg:pt-32">
      <PageHeader
        eyebrow="POLICY // PRIVACY"
        title="Privacy"
        description="A short overview of what the app records, why it exists, and how the data is used across the protocol."
        actions={<Link href="/dashboard" className="app-secondary">Back to Explore</Link>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="app-surface p-6">
            <h2 className="mb-3 font-pixel text-xl uppercase tracking-wider text-zinc-950 dark:text-zinc-50">{section.title}</h2>
            <p className="app-copy">{section.body}</p>
          </article>
        ))}
      </div>
    </SiteFrame>
  )
}
