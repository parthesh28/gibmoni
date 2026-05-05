'use client'

import { useEffect } from 'react'
import FloatingNav from '@/components/floatingNav'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <FloatingNav />
        <div className="w-full max-w-md border-2 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-red-500/10 dark:bg-red-500/10">
                <span className="text-[10px] font-mono tracking-widest uppercase text-red-600 dark:text-red-400">
                    SYSTEM_ERROR // EXCEPTION
                </span>
            </div>
            <div className="p-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center bg-red-500/5">
                    <span className="text-xl font-mono text-red-500">!</span>
                </div>
                <h2 className="font-pixel text-xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                    Fatal Error
                </h2>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-8 break-all">
                    {error.message || "An unexpected error occurred during execution."}
                </p>
                <button
                    onClick={() => reset()}
                    className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-3 text-[10px] font-mono tracking-wider uppercase font-bold transition-colors duration-200"
                >
                    [ REBOOT_PROCESS ]
                </button>
            </div>
        </div>
    </main>
  )
}
