'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Compass, Plus, User } from 'lucide-react';
import { ThemeSelect } from './themeSelect';

export default function FloatingNav() {
    const pathname = usePathname();
    const { publicKey } = useWallet();

    const navItems = [
        { href: '/dashboard', label: 'Explore', icon: Compass },
        { href: '/create', label: 'Create', icon: Plus },
    ];

    return (
        <>
            {/* Bottom center floating pill */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-0 border border-zinc-300 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-[4px_4px_0_0_#27272a] dark:shadow-[4px_4px_0_0_#3f3f46]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-5 py-3 text-[10px] font-mono tracking-widest uppercase transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[#ea580c] text-white'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                                }`}
                            >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Top right corner: theme + profile */}
            <div className="fixed top-4 right-4 lg:top-6 lg:right-6 z-50 flex items-center gap-2">
                <ThemeSelect />
                <Link
                    href="/profile"
                    className={`flex items-center justify-center w-9 h-9 border transition-all duration-200 ${
                        pathname === '/profile'
                            ? 'border-[#ea580c] bg-[#ea580c] text-white'
                            : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 text-zinc-500 dark:text-zinc-400 hover:text-[#ea580c] dark:hover:text-[#ea580c] hover:border-[#ea580c]'
                    } backdrop-blur-md`}
                >
                    <User className="w-4 h-4" />
                </Link>
            </div>
        </>
    );
}
