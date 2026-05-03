'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Explore' },
        { href: '/create', label: 'Create' },
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
                                className={`px-6 py-3 text-[10px] font-mono tracking-widest uppercase transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[#ea580c] text-white'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

