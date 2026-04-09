'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { ThemeSelect } from './themeSelect';

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const mobileNavItems = [
        { href: '/dashboard', label: 'Explore' },
        { href: '/create', label: 'Create' },
        { href: '/about', label: 'About' },
    ];

    const controlBaseClass = 'flex h-10 w-10 items-center justify-center rounded-none border border-border/80 bg-background text-[#ea580c] transition-all duration-200 hover:border-[#ea580c] hover:bg-[#ea580c]/10 hover:text-[#c2410c]';

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
                            <span className="flex items-center gap-1.5 font-mono text-xs text-[#ea580c]/80 transition-colors duration-300 group-hover:text-[#ea580c] dark:text-[#ea580c]/70 dark:group-hover:text-[#ea580c]">
                                {`[$]`}
                            </span>
                            <span className="font-pixel text-sm tracking-[0.15em] text-[#ea580c] transition-colors duration-300 sm:text-base">
                                GIBMONI
                            </span>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMenuOpen}
                                className={`${controlBaseClass} ${isMenuOpen ? 'border-[#ea580c] bg-[#ea580c] text-white hover:bg-[#c2410c] hover:text-white' : ''}`}
                            >
                                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                            </button>
                            <ThemeSelect />
                            <Link
                                href="/profile"
                                className={`${controlBaseClass} ${pathname === '/profile' ? 'border-[#ea580c] bg-[#ea580c] text-white hover:bg-[#c2410c] hover:text-white' : ''}`}
                            >
                                <User className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {isMenuOpen ? (
                        <div className="mt-3 border border-[#ea580c]/40 bg-background/95 p-2 backdrop-blur">
                            {mobileNavItems.map((item) => {
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`mb-1 block px-3 py-2 text-[10px] font-mono tracking-[0.2em] uppercase transition-colors last:mb-0 ${isActive ? 'bg-[#ea580c] text-white' : 'text-zinc-600 hover:bg-[#ea580c]/10 hover:text-[#ea580c] dark:text-zinc-400 dark:hover:bg-[#ea580c]/15 dark:hover:text-[#ea580c]'}`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : null}
                </nav>
            </div>
        </div>
    )
}