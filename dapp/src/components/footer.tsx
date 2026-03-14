import React from 'react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-8 lg:px-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">

                    {/* Left Side: Brand & Copyright */}
                    <div className="flex gap-4 items-baseline font-mono">
                        <span className="text-sm font-bold tracking-widest text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
                            GIBMONI
                        </span>
                        <span className="text-xs tracking-widest text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
                            (C) {new Date().getFullYear()} PARTHESH28.
                        </span>
                    </div>

                    {/* Right Side: Simple Link Row */}
                    <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-mono text-xs tracking-widest text-zinc-500 dark:text-zinc-500">
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