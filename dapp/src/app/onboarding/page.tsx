'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Terminal, Loader2, AlertTriangle } from 'lucide-react';
import { WalletButton } from "../context/solanaProvider";
import { useGibmoniProgram } from '../hooks/useAnchorQueries';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function OnboardingPage() {
    const router = useRouter();
    const { publicKey, connected } = useWallet();
    const { initializeUser, getUserAccount } = useGibmoniProgram();

    const [status, setStatus] = useState<'AWAITING_WALLET' | 'VERIFYING' | 'REGISTRATION_REQUIRED'>('AWAITING_WALLET');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'FORM' | 'ON_CHAIN' | 'OFF_CHAIN' | 'DONE'>('FORM');

    const [formData, setFormData] = useState({
        alias: '',
        bio: '',
        twitterHandle: '',
        githubUrl: ''
    });

    useEffect(() => {
        if (!connected || !publicKey) {
            setStatus('AWAITING_WALLET');
            return;
        }

        const verifyUser = async () => {
            setStatus('VERIFYING');
            setError(null);

            try {
                const res = await fetch(`${API_URL}/api/users/${publicKey.toBase58()}`);

                if (res.ok) {
                    // User exists in DB — redirect to dashboard
                    router.push('/dashboard');
                } else if (res.status === 404) {
                    setStatus('REGISTRATION_REQUIRED');
                } else {
                    setError('SYSTEM_ERROR: Database verification failed.');
                }
            } catch (err) {
                setError('NETWORK_ERROR: Could not reach the API.');
                setStatus('REGISTRATION_REQUIRED');
            }
        };

        verifyUser();
    }, [connected, publicKey, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey) return;

        setIsSubmitting(true);
        setError(null);

        // STEP 1: Initialize on-chain User PDA (if not already initialized)
        const hasOnChainUser = getUserAccount.data && !getUserAccount.isError;
        if (!hasOnChainUser) {
            try {
                setStep('ON_CHAIN');
                await initializeUser.mutateAsync();
            } catch (err: any) {
                // If PDA already exists, that's fine — continue
                const errMsg = err?.message || String(err);
                if (!errMsg.includes('already in use') && !errMsg.includes('0x0')) {
                    setError('ON-CHAIN ERROR: Failed to initialize user PDA. ' + errMsg);
                    setIsSubmitting(false);
                    setStep('FORM');
                    return;
                }
            }
        }

        // STEP 2: Save off-chain profile to API
        try {
            setStep('OFF_CHAIN');
            const res = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    alias: formData.alias,
                    bio: formData.bio || undefined,
                    twitterHandle: formData.twitterHandle || undefined,
                    githubUrl: formData.githubUrl || undefined,
                }),
            });

            if (res.ok || res.status === 201) {
                setStep('DONE');
                // Invalidate the user account query so it refetches
                getUserAccount.refetch();
                setTimeout(() => router.push('/dashboard'), 500);
            } else {
                const data = await res.json();
                if (data.error === 'USER_ALREADY_EXISTS') {
                    // Already registered, just redirect
                    router.push('/dashboard');
                } else {
                    setError(data.error || 'REGISTRATION_FAILED: Invalid payload.');
                    setStep('FORM');
                }
            }
        } catch (err) {
            setError('NETWORK_ERROR: Registration payload dropped.');
            setStep('FORM');
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepLabels = ['FORM', 'ON_CHAIN', 'OFF_CHAIN', 'DONE'];
    const stepIndex = stepLabels.indexOf(step);

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300 pt-24">

            <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 transition-all duration-300 relative z-10">

                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                            AUTH.SYS // ROOT
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 ${status === 'AWAITING_WALLET' ? 'bg-zinc-400 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`}></div>
                        <div className={`w-2 h-2 ${status === 'VERIFYING' ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`}></div>
                        <div className={`w-2 h-2 ${status === 'REGISTRATION_REQUIRED' ? 'bg-[#ea580c]' : 'bg-zinc-400 dark:bg-zinc-600'}`}></div>
                    </div>
                </div>

                <div className="p-8">

                    {/* STATE 1: Awaiting Wallet */}
                    {status === 'AWAITING_WALLET' && (
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                                <div className="w-4 h-4 bg-[#ea580c] animate-ping opacity-75"></div>
                            </div>
                            <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                                Connect Node
                            </h2>
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                                 Awaiting wallet connection to verify identity on the Solana ledger.
                            </p>

                            <div className="p-1 border border-zinc-300 dark:border-zinc-800/50 bg-zinc-200/50 dark:bg-zinc-900/50 transition-colors duration-300 w-full flex justify-center">
                                <WalletButton />
                            </div>
                        </div>
                    )}

                    {/* STATE 2: Verifying */}
                    {status === 'VERIFYING' && (
                        <div className="flex flex-col items-center text-center py-8">
                            <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin mb-6" />
                            <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                                Verifying...
                            </h2>
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                                 Cross-referencing D1 Database...
                            </p>
                        </div>
                    )}

                    {/* STATE 3: Registration Form */}
                    {status === 'REGISTRATION_REQUIRED' && (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="flex flex-col mb-2">
                                <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-2 uppercase">
                                    Init Profile
                                </h2>
                                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                                    Wallet recognized. Profile missing. Fill out your details and sign the on-chain initialization.
                                </p>
                            </div>

                            {/* Progress Steps (visible during submission) */}
                            {isSubmitting && (
                                <div className="flex items-center gap-1 mb-2">
                                    {stepLabels.map((s, i) => (
                                        <div key={s} className="flex items-center gap-1 flex-1">
                                            <div className={`h-1 flex-1 transition-all duration-500 ${
                                                i <= stepIndex ? 'bg-[#ea580c]' : 'bg-zinc-300 dark:bg-zinc-800'
                                            }`}></div>
                                            <span className={`text-[8px] font-mono tracking-widest ${
                                                i === stepIndex ? 'text-[#ea580c]' : 'text-zinc-400 dark:text-zinc-600'
                                            }`}>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 border border-red-500/50 bg-red-500/10 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-mono">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Alias Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    Developer Alias <span className="text-[#ea580c]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={50}
                                    value={formData.alias}
                                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] dark:focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none"
                                    placeholder="e.g. 0xBuilder"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Bio Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    Bio <span className="text-zinc-400 dark:text-zinc-600">(Optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={250}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] dark:focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none resize-none"
                                    placeholder="Brief description of what you build..."
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Dual Input Row for Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                        GitHub URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.githubUrl}
                                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none"
                                        placeholder="https://github.com/..."
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                        Twitter Handle
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.twitterHandle}
                                        onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none"
                                        placeholder="@handle"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-4 text-sm font-mono tracking-wider uppercase font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{step === 'ON_CHAIN' ? 'Sign Wallet Tx...' : step === 'OFF_CHAIN' ? 'Saving Profile...' : 'Executing...'}</span>
                                    </>
                                ) : (
                                    <span>[ Initialize ]</span>
                                )}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </main>
    );
}