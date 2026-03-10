'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Terminal, Loader2, AlertTriangle } from 'lucide-react';
// IMPORT YOUR WALLET BUTTON HERE (Adjust the path to match your folder structure)
import { WalletButton } from "../context/solanaProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function OnboardingPage() {
    const router = useRouter();
    const { publicKey, connected } = useWallet();

    const [status, setStatus] = useState<'AWAITING_WALLET' | 'VERIFYING' | 'REGISTRATION_REQUIRED'>('AWAITING_WALLET');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        try {
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
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setError(data.error || 'REGISTRATION_FAILED: Invalid payload.');
            }
        } catch (err) {
            setError('NETWORK_ERROR: Registration payload dropped.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300 pt-24">

            <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 shadow-[8px_8px_0_0_#d4d4d8] dark:shadow-[8px_8px_0_0_#27272a] transition-all duration-300 relative z-10">

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

                    {/* STATE 1: Awaiting Wallet (UPDATED) */}
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

                            {/* THE MISSING BUTTON */}
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
                                    Wallet recognized. Off-chain profile missing.
                                </p>
                            </div>

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
                                        <span>Executing...</span>
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