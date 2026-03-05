'use client'
import React from 'react'
import { useGibmoniProgram } from './hooks/useAnchorQueries';
import Home from '../components/home';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/footer';
import { Toaster } from 'sonner';

function App() {
  const { getAllProjects, provider } = useGibmoniProgram()
  const { data } = getAllProjects;
  const router = useRouter()

  const handleViewDetails = (splitId: string) => {
    router.push(`/split/${splitId}`)
  }

  if (!provider?.publicKey) {
    return (
      <div className="flex w-full h-[calc(100vh-5rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
            Please Connect Your Wallet
          </h1>
        </div>
      </div>

    )
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto p-4 pt-20">
          {/* <Home
            programAccounts={data || []}
            userPubkey={provider.publicKey}
            onViewDetails={handleViewDetails}
          /> */}
        </main>
        <Footer />
      </div>
      <Toaster />
    </>

  )
}

export default App;