import React from 'react';
import Link from 'next/link';
import Footer from './footer';

export default function LandingPage() {
    return (
        <main className="min-h-screen transition-colors duration-300">
            {/* HERO */}
            <section className="relative w-full px-6 pt-32 pb-20 lg:px-8 lg:pt-44 lg:pb-36 overflow-hidden">

                {/* Ghost /// — top left */}
                <div className="absolute top-20 -left-4 sm:-left-2 lg:left-0 z-0 pointer-events-none select-none" aria-hidden="true">
                    <span className="block text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-sans font-black italic leading-none text-transparent [-webkit-text-stroke:1.5px_#e4e4e7] dark:[-webkit-text-stroke:1.5px_#27272a] opacity-60 transition-colors duration-300">
                        ///
                    </span>
                </div>

                {/* Ghost $ — bottom right */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-0 pointer-events-none select-none" aria-hidden="true">
                    <span className="block text-[15rem] sm:text-[12rem] md:text-[16rem] lg:text-[30rem] font-sans tracking-tighter leading-none text-transparent [-webkit-text-stroke:1.5px_#e4e4e7] dark:[-webkit-text-stroke:1.5px_#27272a] opacity-50 transition-colors duration-300">
                        $
                    </span>
                </div>  

                {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
                    <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#ea580c] mb-6 block">
                        FUNDING GOVERNANCE ON SOLANA
                    </span>
                    <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl lg:text-8xl tracking-widest text-zinc-900 dark:text-zinc-100 mb-2 select-none uppercase transition-colors duration-300">
                        Pitch. Raise.
                    </h1>
                    <h1 className="font-pixel text-2xl sm:text-3xl md:text-4xl lg:text-6xl tracking-widest text-zinc-900 dark:text-zinc-100 mb-6 sm:mb-8 select-none uppercase transition-colors duration-300">
                        Deliver<span className="text-[#ea580c]">.</span> Unlock<span className="text-[#ea580c]">.</span>
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl sm:max-w-2xl mb-10 sm:mb-12 leading-relaxed font-mono transition-colors duration-300 px-2 sm:px-0">
                        Capital is secured on-chain and released in strict tranches after community approval. Zero upfront payouts. Complete accountability. Built for builders who deliver.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 items-center w-full sm:w-auto">
                        <Link
                            href="/onboarding"
                            className="w-full sm:w-auto px-8 py-4 bg-[#ea580c] text-white text-sm font-mono tracking-widest uppercase hover:bg-[#c2410c] transition-all duration-200 text-center"
                        >
                            GET STARTED
                        </Link>
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto px-8 py-4 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-mono tracking-widest uppercase hover:border-[#ea580c] hover:text-[#ea580c] transition-all duration-200 text-center"
                        >
                            EXPLORE PROJECTS
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── CORE MECHANICS ── */}
            <section className="w-full px-4 sm:px-6 py-16 sm:py-24 lg:px-12 max-w-7xl mx-auto">

                <div className="flex items-center gap-3 sm:gap-4 mb-10 sm:mb-12">
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
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed transition-colors duration-300">
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
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed transition-colors duration-300">
                                Weighted voting power meets strict headcount and capital checks. Prevents both whale domination and mob veto attacks.
                            </p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="group bg-zinc-50 dark:bg-zinc-950 flex flex-col hover:bg-white dark:hover:bg-zinc-900/50 transition-colors duration-300 min-h-[260px] sm:min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-300 dark:border-zinc-800 transition-colors duration-300">
                            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-mono">RISK_BOUNDS</span>
                            <div className="w-2 h-2 bg-[#ea580c]" />
                        </div>
                        <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-zinc-900 dark:text-zinc-100 font-pixel text-lg sm:text-xl lg:text-2xl tracking-wider mb-3 sm:mb-4 uppercase transition-colors duration-300">
                                Bounded Trust
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed transition-colors duration-300">
                                Structural mitigation for cold-start developers. Gated release of funds strictly bounds worst-case funder loss.
                            </p>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="group bg-zinc-50 dark:bg-zinc-950 flex flex-col hover:bg-white dark:hover:bg-zinc-900/50 transition-colors duration-300 min-h-[260px] sm:min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-300 dark:border-zinc-800 transition-colors duration-300">
                            <span className="text-[10px] tracking-widest uppercase text-zinc-500 font-mono">REPUTATION</span>
                            <div className="w-2 h-2 bg-[#ea580c]" />
                        </div>
                        <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center">
                            <h3 className="text-zinc-900 dark:text-zinc-100 font-pixel text-lg sm:text-xl lg:text-2xl tracking-wider mb-3 sm:mb-4 uppercase transition-colors duration-300">
                                Reputation Gain
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed transition-colors duration-300">
                                Developers earn reputation upon delivering, unlocking higher voting powers and community representation.
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="w-full px-4 sm:px-6 py-16 sm:py-24 lg:px-12 max-w-7xl mx-auto">

                <div className="flex items-center gap-3 sm:gap-4 mb-10 sm:mb-12">
                    <span className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-500 font-mono whitespace-nowrap">
                        {"// HOW_IT_WORKS"}
                    </span>
                    <div className="flex-1 border-t border-zinc-300 dark:border-zinc-800 transition-colors duration-300" />
                    <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-mono">
                        002
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { step: '01', title: 'Onboard', desc: 'Connect your wallet and authorize your GitHub account to generate your on-chain identity and trust scores.' },
                        { step: '02', title: 'Create or Fund', desc: 'Launch a project with funding goals and deadlines, or back promising builders with SOL contributions.' },
                        { step: '03', title: 'Vote on Milestones', desc: 'Community governance decides fund releases. Each milestone goes through a quadratic voting round.' },
                        { step: '04', title: 'Deliver & Earn', desc: 'Complete all 4 milestones to unlock funds. Your reputation grows with each successful delivery.' },
                    ].map((item) => (
                        <div key={item.step} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-6 sm:p-8 flex flex-col gap-4 group hover:border-[#ea580c]/40 transition-colors duration-300">
                            <span className="text-3xl sm:text-4xl font-mono font-bold text-[#ea580c]/20 group-hover:text-[#ea580c]/40 transition-colors duration-300">
                                {item.step}
                            </span>
                            <h4 className="font-pixel text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                {item.title}
                            </h4>
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PROTOCOL NUMBERS ── */}
            <section className="w-full px-4 sm:px-6 py-16 sm:py-24 lg:px-12 max-w-7xl mx-auto">

                <div className="flex items-center gap-3 sm:gap-4 mb-10 sm:mb-12">
                    <span className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-500 font-mono whitespace-nowrap">
                        {"// PROTOCOL_SPECS"}
                    </span>
                    <div className="flex-1 border-t border-zinc-300 dark:border-zinc-800 transition-colors duration-300" />
                    <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-mono">
                        003
                    </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-800">
                    {[
                        { value: 'Solana', label: 'Blockchain' },
                        { value: '4', label: 'Milestone Checkpoints' },
                        { value: '3', label: 'Voting Attempts' },
                        { value: '100%', label: 'On-Chain Governance' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-8 text-center flex flex-col gap-2">
                            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#ea580c]">{stat.value}</span>
                            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>
            
            <Footer />
        </main>
    );
}