import Link from 'next/link'

import { SiteFrame, PageHeader } from '@/components/pageFrame'

const terms = [
  'Wallets are the source of identity inside the app, and you are responsible for all transactions signed from your connected wallet.',
  'Project creators must provide accurate metadata. The protocol may surface on-chain state and associated off-chain records in public views.',
  'Funding, voting, and milestone actions are irreversible once confirmed on-chain. Review transaction prompts carefully before signing.',
]

export default function TermsPage() {
  return (
    <SiteFrame contentClassName="pt-28 lg:pt-32">
      <PageHeader
        eyebrow="POLICY // TERMS"
        title="Terms"
        description="Core usage rules for the app, the wallet flow, and the way protocol actions are displayed across the product."
        actions={<Link href="/dashboard" className="app-secondary">Back to Explore</Link>}
      />

      <div className="app-surface overflow-hidden">
        <div className="app-surface-header">
          <span className="app-eyebrow">USAGE RULES</span>
        </div>
        <div className="space-y-4 p-6">
          {terms.map((term, index) => (
            <div key={term} className="flex gap-4 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
              <span className="font-mono text-xs tracking-widest text-[#ea580c]">0{index + 1}</span>
              <p className="app-copy">{term}</p>
            </div>
          ))}
        </div>
      </div>
    </SiteFrame>
  )
}
