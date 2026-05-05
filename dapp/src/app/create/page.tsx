'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Terminal, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useGibmoniProgram } from '../hooks/useAnchorQueries';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { WalletButton } from '../context/solanaProvider';
import FloatingNav from '@/components/floatingNav';
import { BrutalistLoader } from '@/components/brutalistLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const CATEGORIES = ['DeFi', 'NFT', 'Gaming', 'DAO', 'Infrastructure', 'Social', 'Other'];

export default function CreateProjectPage() {
    const router = useRouter();
    const { publicKey, connected } = useWallet();
    const { createProject, program } = useGibmoniProgram();

    const [step, setStep] = useState<'FORM' | 'SIGNING' | 'POSTING' | 'DONE'>('FORM');
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        tagline: '',
        category: 'DeFi',
        description: '',
        targetAmount: '',
        fundingDays: '14',
        deliveryDays: '90',
    });

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey || !connected) return;
        setError(null);

        if (!form.title.trim() || !form.tagline.trim() || !form.description.trim() || !form.targetAmount) {
            setError('ERR: All required fields must be populated.');
            return;
        }

        const targetLamports = Math.floor(parseFloat(form.targetAmount) * LAMPORTS_PER_SOL);
        if (targetLamports <= 0) {
            setError('ERR: Target amount must be greater than 0.');
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        const fundingDeadline = now + (parseInt(form.fundingDays) * 86400);
        const deliveryDeadline = now + (parseInt(form.deliveryDays) * 86400);

        // STEP 1: On-chain transaction
        setStep('SIGNING');
        try {
            await createProject.mutateAsync({
                projectName: form.title,
                targetAmount: new anchor.BN(targetLamports),
                fundingDeadline: new anchor.BN(fundingDeadline),
                deliveryDeadline: new anchor.BN(deliveryDeadline),
            });
        } catch (err: any) {
            console.error('On-chain error:', err);
            setError('CHAIN_ERROR: Transaction rejected or failed. Check console.');
            setStep('FORM');
            return;
        }

        // Derive PDA for project ID
        const [projectPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("PROJECT"), Buffer.from(form.title), publicKey.toBuffer()],
            program.programId
        );

        // STEP 2: Off-chain API post
        setStep('POSTING');
        try {
            const res = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: projectPda.toBase58(),
                    creatorWallet: publicKey.toBase58(),
                    title: form.title,
                    tagline: form.tagline,
                    description: form.description,
                    category: form.category,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                console.error("API Error Response:", data);
                setError(`API_WARNING: On-chain tx succeeded, but metadata API failed. Project exists on-chain. Resync later.`);
                setStep('DONE'); // Proceed to DONE anyway since the core project is created on-chain
                setTimeout(() => {
                    router.push(`/project/${projectPda.toBase58()}`);
                }, 3000);
                return;
            }
        } catch (err) {
            console.error("Network Error posting project metadata:", err);
            setError('API_WARNING: On-chain tx succeeded, but network error syncing metadata. Project exists on chain.');
            setStep('DONE');
            setTimeout(() => {
                router.push(`/project/${projectPda.toBase58()}`);
            }, 3000);
            return;
        }

        setStep('DONE');
        setTimeout(() => {
            router.push(`/project/${projectPda.toBase58()}`);
        }, 1500);
    };

    // Not connected
    if (!connected || !publicKey) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300">
                <FloatingNav />
                <div className="w-full max-w-md border-2 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                        <Terminal className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                            CREATE.SYS // AUTH_REQUIRED
                        </span>
                    </div>
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                            <div className="w-4 h-4 bg-[#ea580c] animate-ping opacity-75"></div>
                        </div>
                        <h2 className="font-pixel text-xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                            Connect Wallet
                        </h2>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-8">
                            Wallet connection required to initialize a project on the Solana ledger.
                        </p>
                        <WalletButton />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen transition-colors duration-300 px-4 sm:px-6 lg:px-12 pt-24 pb-28">
            <FloatingNav />

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Terminal className="w-5 h-5 text-[#ea580c]" />
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                            CREATE.SYS // INIT_PROJECT
                        </span>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center gap-3 mb-6">
                        {(['FORM', 'SIGNING', 'POSTING', 'DONE'] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 transition-all ${
                                    step === s ? (s === 'DONE' ? 'bg-green-500' : 'bg-[#ea580c] animate-pulse') :
                                    (['FORM', 'SIGNING', 'POSTING', 'DONE'].indexOf(step) > i ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700')
                                }`}></div>
                                <span className="text-[9px] font-mono text-zinc-400 uppercase hidden sm:inline">{s}</span>
                                {i < 3 && <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Success State */}
                {step === 'DONE' && (
                    <div className="border-2 border-green-500/30 p-16 flex flex-col items-center text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                        <h2 className="font-pixel text-3xl text-zinc-900 dark:text-zinc-100 mb-3 uppercase">
                            Project Live
                        </h2>
                        <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                            Redirecting to project terminal...
                        </p>
                    </div>
                )}

                {/* Signing / Posting States */}
                {(step === 'SIGNING' || step === 'POSTING') && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-16 flex flex-col items-center text-center">
                        <BrutalistLoader text="" />
                        <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-3 uppercase">
                            {step === 'SIGNING' ? 'Awaiting Signature' : 'Posting Metadata'}
                        </h2>
                        <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                            {step === 'SIGNING'
                                ? 'Confirm the transaction in your wallet...'
                                : 'Writing off-chain data to D1 database...'}
                        </p>
                    </div>
                )}

                {/* Form */}
                {step === 'FORM' && (
                    <div className="border-2 border-zinc-300 dark:border-zinc-800">
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/50">
                            <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 uppercase">
                                Init Project
                            </h2>
                            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                                Define your project parameters. On-chain tx will be executed first, then metadata saved.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 lg:p-8 flex flex-col gap-6">
                            {error && (
                                <div className="p-4 border border-red-500/50 bg-red-500/10 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-mono">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Title */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    Project Name <span className="text-[#ea580c]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={50}
                                    value={form.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none"
                                    placeholder="e.g. SolVault Protocol"
                                />
                                <span className="text-[9px] font-mono text-zinc-400">{form.title.length}/50 — Used as PDA seed (immutable)</span>
                            </div>

                            {/* Tagline */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    Tagline <span className="text-[#ea580c]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={200}
                                    value={form.tagline}
                                    onChange={(e) => updateField('tagline', e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none"
                                    placeholder="One-line pitch for the dashboard"
                                />
                            </div>

                            {/* Category + Target */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                        Category
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => updateField('category', e.target.value)}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none appearance-none"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                        Target (SOL) <span className="text-[#ea580c]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0.01"
                                        value={form.targetAmount}
                                        onChange={(e) => updateField('targetAmount', e.target.value)}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none"
                                        placeholder="10.0"
                                    />
                                </div>
                            </div>

                            {/* Deadlines */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                        Funding Window (days)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="90"
                                        value={form.fundingDays}
                                        onChange={(e) => updateField('fundingDays', e.target.value)}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                        Delivery Window (days)
                                    </label>
                                    <input
                                        type="number"
                                        min="7"
                                        max="365"
                                        value={form.deliveryDays}
                                        onChange={(e) => updateField('deliveryDays', e.target.value)}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    Description <span className="text-[#ea580c]">*</span>
                                </label>
                                <textarea
                                    rows={8}
                                    required
                                    maxLength={5000}
                                    value={form.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none resize-none"
                                    placeholder="Describe your project in detail. What problem does it solve? What are the deliverables?"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={createProject.isPending}
                                className="mt-2 w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-4 text-sm font-mono tracking-wider uppercase font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                [ DEPLOY_PROJECT ]
                            </button>

                            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 text-center">
                                This will execute an on-chain transaction followed by an off-chain metadata write.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </main>
    );
}
