import React from 'react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full border-t border-border/80 bg-background/95 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-8 lg:px-12">
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

                    {/* Left Side: Brand & Copyright */}
                    <div className="flex gap-4 items-baseline font-mono">
                        <span className="text-sm font-bold tracking-widest text-zinc-950 dark:text-zinc-100 transition-colors duration-300">
                            GIBMONI
                        </span>
                        <span className="text-xs tracking-widest text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
                            (C) {new Date().getFullYear()} PARTHESH28.
                        </span>
                    </div>

                    {/* Right Side: Simple Link Row */}
                    <div className="flex flex-wrap items-center gap-6 font-mono text-xs tracking-widest text-zinc-500 dark:text-zinc-400 sm:gap-8">
                        <Link
                            href="/dashboard"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Explore
                        </Link>
                        <Link
                            href="/create"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Create
                        </Link>
                        <Link
                            href="/profile"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Profile
                        </Link>
                        <Link
                            href="/about"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            About
                        </Link>
                        <Link
                            href="/privacy"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/terms"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Terms
                        </Link>
                        <Link
                            href="/status"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Status
                        </Link>
                        <a
                            href="https://github.com/parthesh28"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 uppercase"
                        >
                            Github
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
}

export default Footer;