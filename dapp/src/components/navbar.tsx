'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { ThemeSelect } from './themeSelect';

export default function Navbar() {
    const pathname = usePathname();
    const { connected } = useWallet();

    return (
        <div className="fixed top-0 left-0 right-0 w-full px-4 pt-4 lg:px-6 lg:pt-6 z-50">
            <div className="relative w-full max-w-7xl mx-auto">
                <nav className="relative w-full border border-zinc-300/60 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-6 py-3 lg:px-8 transition-colors duration-300">

                    {/* Corner accents */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[#ea580c]/40 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-[#ea580c]/40 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-[#ea580c]/40 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#ea580c]/40 pointer-events-none transition-colors duration-300"></div>

                    <div className="flex items-center justify-between">
                        {/* Logo — goes to /dashboard if connected, / on landing or disconnected */}
                        <Link href={connected ? '/dashboard' : '/'} className="flex items-center gap-3 group">
                            <span className="flex items-center justify-center w-8 h-8 border border-[#ea580c]/30 bg-[#ea580c]/5 text-[#ea580c] font-mono text-xs font-bold group-hover:bg-[#ea580c]/10 transition-colors duration-300">
                                {`$`}
                            </span>
                            <span className="text-sm sm:text-base tracking-[0.15em] text-zinc-900 dark:text-zinc-100 font-pixel transition-colors duration-300">
                                ASSUREFUND  
                            </span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <ThemeSelect />
                            
                            {/* Profile Link — shown on inner routes, styled identically to ThemeSelect */}
                            {pathname !== '/' && (
                                <Link
                                    href="/profile"
                                    className={`flex items-center justify-center w-10 h-10 border transition-all duration-200 ${
                                        pathname === '/profile'
                                            ? 'border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c]'
                                            : 'border-zinc-300/60 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/95 text-zinc-500 dark:text-zinc-400 hover:text-[#ea580c] hover:border-[#ea580c]/40 hover:bg-[#ea580c]/5'
                                    }`}
                                    title="Profile"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    )
}