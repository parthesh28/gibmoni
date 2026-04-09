'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Plus, User } from 'lucide-react';
import { ThemeSelect } from './themeSelect';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <div className="absolute top-0 left-0 right-0 z-50 w-full px-4 pt-4 lg:px-6 lg:pt-6">
            <div className="relative w-full max-w-7xl mx-auto">
                <nav className="relative w-full border border-border/80 bg-background/90 px-5 py-3 shadow-xl backdrop-blur-xl transition-colors duration-300 lg:px-6">

                    <div className="absolute top-1 left-1 h-1.5 w-1.5 border-t border-l border-[#ea580c]/50 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute top-1 right-1 h-1.5 w-1.5 border-t border-r border-[#ea580c]/50 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute bottom-1 left-1 h-1.5 w-1.5 border-b border-l border-[#ea580c]/50 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute bottom-1 right-1 h-1.5 w-1.5 border-b border-r border-[#ea580c]/50 pointer-events-none transition-colors duration-300"></div>

                    <div className="flex items-center justify-between gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 transition-colors duration-300 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                                {`[$]`}
                            </span>
                            <span className="font-pixel text-sm tracking-[0.15em] text-[#ea580c] transition-colors duration-300 sm:text-base">
                                GIBMONI
                            </span>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <ThemeSelect />
                            <Link
                                href="/profile"
                                className={`flex h-10 w-10 items-center justify-center border transition-all duration-200 ${pathname === '/profile' ? 'border-[#ea580c] bg-[#ea580c] text-white' : 'border-border/80 bg-background text-zinc-500 hover:border-[#ea580c] hover:text-[#ea580c]'}`}
                            >
                                <User className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    )
}