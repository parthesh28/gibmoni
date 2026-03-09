import React from 'react';
import Link from 'next/link';
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
    return (
        <main className="min-h-screen transition-colors duration-300">

            {/* ── HERO ── */}
            <section className="relative w-full px-6 pt-32 pb-20 lg:px-8 lg:pt-40 lg:pb-32 overflow-hidden">

                {/* Ghost /// — top left */}
                <div className="absolute top-20 -left-4 sm:-left-2 lg:left-0 z-0 pointer-events-none select-none" aria-hidden="true">
                    <span className="block text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-sans font-black italic leading-none text-transparent [-webkit-text-stroke:1.5px_#e4e4e7] dark:[-webkit-text-stroke:1.5px_#27272a] opacity-60 transition-colors duration-300">
                        ///
                    </span>
                </div>

                {/* Ghost $ — bottom right */}
                {/* Ghost $ — bottom right, fully visible */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-0 pointer-events-none select-none" aria-hidden="true">
                    <span className="block text-[15rem] sm:text-[12rem] md:text-[16rem] lg:text-[30rem] font-sans tracking-tighter leading-none text-transparent [-webkit-text-stroke:1.5px_#e4e4e7] dark:[-webkit-text-stroke:1.5px_#27272a] opacity-50 transition-colors duration-300">
                        $
                    </span>
                </div>  

                {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
                    <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl lg:text-8xl tracking-widest text-zinc-900 dark:text-zinc-100 mb-2 select-none uppercase transition-colors duration-300">
                        Pitch. Raise.
                    </h1>
                    <h1 className="font-pixel text-2xl sm:text-3xl md:text-4xl lg:text-6xl tracking-widest text-zinc-900 dark:text-zinc-100 mb-6 sm:mb-8 select-none uppercase transition-colors duration-300">
                        Deliver<span className="text-[#ea580c]">.</span> Unlock<span className="text-[#ea580c]">.</span>
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl sm:max-w-2xl mb-10 sm:mb-12 leading-relaxed font-code transition-colors duration-300 px-2 sm:px-0">
                        A funding governance protocol on Solana. Capital is secured and released in strict tranches after the community approves. Zero upfront payouts. Complete accountability.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center w-full sm:w-auto">
                        <Link
                            href="/create"
                            className="group flex items-center sm:w-auto bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-sm font-mono tracking-wider uppercase hover:opacity-90 transition-all"
                        >
                            <span className="flex items-center justify-center w-12 h-12 bg-[#ea580c] text-zinc-50 dark:text-zinc-900 transition-colors shrink-0">
                                <ArrowRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                            </span>
                            <span className="px-6 py-3 font-bold whitespace-nowrap flex-1 text-center sm:text-left">
                                Get Started
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── CORE MECHANICS ── */}
            <section className="w-full px-4 sm:px-6 py-16 sm:py-20 lg:px-12 max-w-7xl mx-auto">

                <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                    <span className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-500 font-mono whitespace-nowrap">
                        {"// CORE_MECHANICS"}
                    </span>
                    <div className="flex-1 border-t border-zinc-300 dark:border-zinc-800 transition-colors duration-300" />
                    <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-mono">
                        001
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 transition-colors duration-300">

                    {/* Card 1 */}
                    <div className="group bg-zinc-50 dark:bg-zinc-950 flex flex-col hover:bg-white dark:hover:bg-zinc-900/50 transition-colors duration-300 min-h-[260px] sm:min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-300 dark:border-zinc-800 transition-colors duration-300">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-[#ea580c]" />
                                <div className="w-2 h-2 border border-zinc-400 dark:border-zinc-600" />
                                <div className="w-2 h-2 border border-zinc-400 dark:border-zinc-600" />
                            </div>
                            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-mono">VAULT.SYS</span>
                        </div>
                        <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-zinc-900 dark:text-zinc-100 font-pixel text-lg sm:text-xl lg:text-2xl tracking-wider mb-3 sm:mb-4 uppercase transition-colors duration-300">
                                Secured Vault
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-code leading-relaxed transition-colors duration-300">
                                Zero upfront payouts. Funds are held securely in an on-chain vault and released in predefined sequential tranches.
                            </p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="group bg-zinc-50 dark:bg-zinc-950 flex flex-col hover:bg-white dark:hover:bg-zinc-900/50 transition-colors duration-300 min-h-[260px] sm:min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-300 dark:border-zinc-800 transition-colors duration-300">
                            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-mono">GOVERNANCE</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 border border-zinc-400 dark:border-zinc-600" />
                                <div className="w-2 h-2 border border-zinc-400 dark:border-zinc-600" />
                                <div className="w-2 h-2 bg-[#ea580c]" />
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-zinc-900 dark:text-zinc-100 font-pixel text-lg sm:text-xl lg:text-2xl tracking-wider mb-3 sm:mb-4 uppercase transition-colors duration-300">
                                Quadratic + Bicameral Voting
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-code leading-relaxed transition-colors duration-300">
                                Weighted voting power meets a strict headcount and capital checks. Prevents both whale domination and mob veto attacks.
                            </p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="group bg-zinc-50 dark:bg-zinc-950 flex flex-col hover:bg-white dark:hover:bg-zinc-900/50 transition-colors duration-300 min-h-[260px] sm:min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-300 dark:border-zinc-800 transition-colors duration-300">
                            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-mono">RISK_BOUNDS.METRICS</span>
                            <div className="w-2 h-2 bg-[#ea580c]" />
                        </div>
                        <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-zinc-900 dark:text-zinc-100 font-pixel text-lg sm:text-xl lg:text-2xl tracking-wider mb-3 sm:mb-4 uppercase transition-colors duration-300">
                                Bounded Trust
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-code leading-relaxed transition-colors duration-300">
                                Structural mitigation for cold-start developers. Gated release of funds strictly bounds worst-case funder loss.
                            </p>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="group bg-zinc-50 dark:bg-zinc-950 flex flex-col hover:bg-white dark:hover:bg-zinc-900/50 transition-colors duration-300 min-h-[260px] sm:min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-300 dark:border-zinc-800 transition-colors duration-300">
                            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-mono">Reputation.STATUS</span>
                            <div className="w-2 h-2 bg-[#ea580c]" />
                        </div>
                        <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-zinc-900 dark:text-zinc-100 font-pixel text-lg sm:text-xl lg:text-2xl tracking-wider mb-3 sm:mb-4 uppercase transition-colors duration-300">
                                Reputation Gain
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-code leading-relaxed transition-colors duration-300">
                                Developers gain on reputation upon delivering, thus unlocking higher voting powers and community representation.
                            </p>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}