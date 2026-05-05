'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';
import { WalletButton } from "../context/solanaProvider";
import { useGibmoniProgram } from '../hooks/useAnchorQueries';
import FloatingNav from '@/components/floatingNav';
import { BrutalistLoader } from '@/components/brutalistLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';

type OnboardingStep = 'CONNECT_WALLET' | 'AUTHORIZE_GITHUB' | 'PROFILE_DETAILS' | 'CREATE_ACCOUNT';

const STEPS: OnboardingStep[] = ['CONNECT_WALLET', 'AUTHORIZE_GITHUB', 'PROFILE_DETAILS', 'CREATE_ACCOUNT'];
const STEP_LABELS: Record<OnboardingStep, string> = {
    CONNECT_WALLET: '01 — WALLET',
    AUTHORIZE_GITHUB: '02 — GITHUB',
    PROFILE_DETAILS: '03 — PROFILE',
    CREATE_ACCOUNT: '04 — DEPLOY',
};

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { publicKey, connected, signMessage } = useWallet();
    const { initializeUser, getUserAccount } = useGibmoniProgram();

    const [step, setStep] = useState<OnboardingStep>('CONNECT_WALLET');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // GitHub OAuth state
    const [githubUsername, setGithubUsername] = useState('');
    const [githubAvatarUrl, setGithubAvatarUrl] = useState('');
    const [verifyToken, setVerifyToken] = useState('');

    // Profile form state
    const [formData, setFormData] = useState({
        alias: '',
        bio: '',
        twitterHandle: '',
    });

    // Submission progress substep
    const [deploySubstep, setDeploySubstep] = useState<'IDLE' | 'SIGNING' | 'SCORING' | 'ON_CHAIN' | 'OFF_CHAIN' | 'DONE'>('IDLE');

    // ── Step 1: Auto-redirect if already registered ──────────────────
    useEffect(() => {
        if (!connected || !publicKey) {
            setStep('CONNECT_WALLET');
            return;
        }

        const verifyUser = async () => {
            setIsLoading(true);
            setLoadingMessage('Checking existing registration...');
            setError(null);

            try {
                const res = await fetch(`${API_URL}/api/users/${publicKey.toBase58()}`);

                if (res.ok) {
                    router.push('/dashboard');
                    return;
                } else if (res.status === 404) {
                    // New user — proceed to GitHub step (or handle OAuth callback)
                    setStep('AUTHORIZE_GITHUB');
                } else {
                    setError('System error: Database verification failed.');
                }
            } catch (err) {
                setError('Network error: Could not reach the API.');
                setStep('AUTHORIZE_GITHUB');
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
            }
        };

        verifyUser();
    }, [connected, publicKey, router]);

    // ── Handle GitHub OAuth callback ─────────────────────────────────
    useEffect(() => {
        const code = searchParams.get('code');
        if (!code || !publicKey || !connected) return;
        if (githubUsername) return; // Already processed

        const exchangeCode = async () => {
            setIsLoading(true);
            setLoadingMessage('Verifying GitHub authorization...');
            setError(null);

            try {
                const res = await fetch(`${API_URL}/api/auth/github/callback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code,
                        walletAddress: publicKey.toBase58(),
                    }),
                });

                const data = await res.json();

                if (res.ok && data.githubUsername) {
                    setGithubUsername(data.githubUsername);
                    setGithubAvatarUrl(data.githubAvatarUrl || '');
                    setVerifyToken(data.verifyToken);
                    setStep('PROFILE_DETAILS');

                    // Clean the URL
                    window.history.replaceState({}, '', '/onboarding');
                } else {
                    setError(data.error || 'GitHub authorization failed.');
                }
            } catch (err) {
                setError('Network error during GitHub authorization.');
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
            }
        };

        exchangeCode();
    }, [searchParams, publicKey, connected, githubUsername]);

    // ── GitHub OAuth redirect ────────────────────────────────────────
    const handleGithubAuth = useCallback(() => {
        const redirectUri = `${window.location.origin}/onboarding`;
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`;
        window.location.href = githubAuthUrl;
    }, []);

    // ── Step 4: Create Account ───────────────────────────────────────
    const handleCreateAccount = async () => {
        if (!publicKey || !signMessage) return;

        setIsLoading(true);
        setError(null);
        setDeploySubstep('SIGNING');
        setLoadingMessage('Sign the wallet verification message...');

        try {
            // 1. Sign a wallet verification message
            const timestamp = Date.now();
            const messageString = `gibmoni-onboarding:${publicKey.toBase58()}:${timestamp}`;
            const messageBytes = new TextEncoder().encode(messageString);
            const signatureBytes = await signMessage(messageBytes);

            // Convert signature to base58
            const bs58Module = await import('bs58');
            const signatureBase58 = bs58Module.default.encode(signatureBytes);

            // 2. Request scores from API
            setDeploySubstep('SCORING');
            setLoadingMessage('Computing reputation scores...');

            const scoresRes = await fetch(`${API_URL}/api/auth/onboarding-scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    signature: signatureBase58,
                    message: messageString,
                    verifyToken,
                }),
            });

            const scoresData = await scoresRes.json();

            if (!scoresRes.ok) {
                throw new Error(scoresData.error || 'Failed to compute scores.');
            }

            // 3. On-chain: Initialize User PDA with Ed25519 verified scores
            setDeploySubstep('ON_CHAIN');
            setLoadingMessage('Confirm the on-chain transaction...');

            const hasOnChainUser = getUserAccount.data && !getUserAccount.isError;
            if (!hasOnChainUser) {
                try {
                    await initializeUser.mutateAsync({
                        walletScore: scoresData.walletScore,
                        githubScore: scoresData.githubScore,
                        scoreTimestamp: scoresData.timestamp,
                        oracleSignature: scoresData.oracleSignature,
                    });
                } catch (err: any) {
                    const errMsg = err?.message || String(err);
                    if (!errMsg.includes('already in use') && !errMsg.includes('0x0')) {
                        throw new Error('On-chain initialization failed: ' + errMsg);
                    }
                }
            }

            // 4. Off-chain: Save profile to API
            setDeploySubstep('OFF_CHAIN');
            setLoadingMessage('Saving profile data...');

            const profileRes = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    alias: formData.alias,
                    bio: formData.bio || undefined,
                    twitterHandle: formData.twitterHandle || undefined,
                    githubUrl: `https://github.com/${githubUsername}`,
                    signature: signatureBase58,
                    message: messageString,
                }),
            });

            if (profileRes.ok || profileRes.status === 201) {
                setDeploySubstep('DONE');
                setLoadingMessage('Account created!');
                getUserAccount.refetch();
                setTimeout(() => router.push('/dashboard'), 800);
            } else {
                const data = await profileRes.json();
                if (data.error === 'USER_ALREADY_EXISTS') {
                    router.push('/dashboard');
                } else {
                    throw new Error(data.error || 'Profile registration failed.');
                }
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
            setDeploySubstep('IDLE');
        } finally {
            if (deploySubstep !== 'DONE') {
                setIsLoading(false);
                setLoadingMessage('');
            }
        }
    };

    const currentStepIndex = STEPS.indexOf(step);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 pt-24">

            <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 transition-all duration-300 relative z-10">

                {/* ── Window Title Bar ─────────────────────────── */}
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                        AUTH.SYS // ONBOARDING
                    </span>
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 transition-colors duration-300 ${
                                    i < currentStepIndex
                                        ? 'bg-green-500'
                                        : i === currentStepIndex
                                            ? 'bg-[#ea580c] animate-pulse'
                                            : 'bg-zinc-400 dark:bg-zinc-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Step Indicator ───────────────────────────── */}
                <div className="grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800/50">
                    {STEPS.map((s, i) => (
                        <div
                            key={s}
                            className={`py-2 text-center text-[8px] font-mono tracking-widest uppercase transition-all duration-300 ${
                                i < currentStepIndex
                                    ? 'text-green-600 dark:text-green-400 bg-green-500/5'
                                    : i === currentStepIndex
                                        ? 'text-[#ea580c] bg-[#ea580c]/5 border-b-2 border-[#ea580c]'
                                        : 'text-zinc-400 dark:text-zinc-600'
                            }`}
                        >
                            {STEP_LABELS[s]}
                        </div>
                    ))}
                </div>

                <div className="p-8">

                    {/* ── Loading Overlay ──────────────────────── */}
                    {isLoading && step !== 'CREATE_ACCOUNT' && (
                        <BrutalistLoader text={loadingMessage || 'Processing...'} />
                    )}

                    {/* ── Error Display ────────────────────────── */}
                    {error && (
                        <div className="p-3 mb-6 border border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono">
                            {error}
                        </div>
                    )}

                    {/* ═══ STEP 1: CONNECT WALLET ═════════════════ */}
                    {step === 'CONNECT_WALLET' && !isLoading && (
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                                <div className="w-4 h-4 bg-[#ea580c] animate-ping opacity-75" />
                            </div>
                            <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                                Connect Node
                            </h2>
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                                Connect your Solana wallet to begin the onboarding process.
                            </p>

                            <div className="p-1 border border-zinc-300 dark:border-zinc-800/50 bg-zinc-200/50 dark:bg-zinc-900/50 transition-colors duration-300 w-full flex justify-center">
                                <WalletButton />
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 2: AUTHORIZE GITHUB ═══════════════ */}
                    {step === 'AUTHORIZE_GITHUB' && !isLoading && (
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </div>
                            <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                                Authorize GitHub
                            </h2>
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                                Link your GitHub account to verify your developer identity. This generates a reputation score stored on-chain.
                            </p>

                            <button
                                onClick={handleGithubAuth}
                                className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-4 text-sm font-mono tracking-wider uppercase font-bold transition-colors duration-200"
                            >
                                Authorize with GitHub
                            </button>
                        </div>
                    )}

                    {/* ═══ STEP 3: PROFILE DETAILS ════════════════ */}
                    {step === 'PROFILE_DETAILS' && !isLoading && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                setStep('CREATE_ACCOUNT');
                            }}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex flex-col mb-2">
                                <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-2 uppercase">
                                    Init Profile
                                </h2>
                                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                                    Fill out your developer profile. GitHub is verified.
                                </p>
                            </div>

                            {/* GitHub Verified Badge */}
                            <div className="flex items-center gap-3 p-3 border border-green-500/30 bg-green-500/5">
                                {githubAvatarUrl && (
                                    <img
                                        src={githubAvatarUrl}
                                        alt=""
                                        className="w-8 h-8 border border-zinc-300 dark:border-zinc-700"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono text-green-600 dark:text-green-400 tracking-widest uppercase">
                                        VERIFIED
                                    </p>
                                    <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 truncate">
                                        {githubUsername}
                                    </p>
                                </div>
                            </div>

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

                            {/* Twitter Handle */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    Twitter Handle <span className="text-zinc-400 dark:text-zinc-600">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.twitterHandle}
                                    onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] dark:focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-all rounded-none"
                                    placeholder="@handle"
                                />
                            </div>

                            {/* Continue Button */}
                            <button
                                type="submit"
                                disabled={!formData.alias.trim()}
                                className="mt-2 w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-4 text-sm font-mono tracking-wider uppercase font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </form>
                    )}

                    {/* ═══ STEP 4: CREATE ACCOUNT ════════════════ */}
                    {step === 'CREATE_ACCOUNT' && (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col mb-2">
                                <h2 className="font-pixel text-2xl text-zinc-900 dark:text-zinc-100 mb-2 uppercase">
                                    Deploy Account
                                </h2>
                                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                                    Create your on-chain identity and save your profile.
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="border border-zinc-300 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800/50">
                                <div className="flex justify-between px-4 py-3">
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Wallet</span>
                                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate ml-4 max-w-[180px]">
                                        {publicKey?.toBase58()}
                                    </span>
                                </div>
                                <div className="flex justify-between px-4 py-3">
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">GitHub</span>
                                    <span className="text-xs font-mono text-green-600 dark:text-green-400">{githubUsername}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3">
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Alias</span>
                                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{formData.alias}</span>
                                </div>
                            </div>

                            {/* Deploy Progress */}
                            {deploySubstep !== 'IDLE' && (
                                <div className="flex flex-col gap-2">
                                    {(['SIGNING', 'SCORING', 'ON_CHAIN', 'OFF_CHAIN', 'DONE'] as const).map((sub) => {
                                        const labels: Record<string, string> = {
                                            SIGNING: 'Wallet signature',
                                            SCORING: 'Computing scores',
                                            ON_CHAIN: 'On-chain transaction',
                                            OFF_CHAIN: 'Saving profile',
                                            DONE: 'Complete',
                                        };
                                        const subSteps = ['SIGNING', 'SCORING', 'ON_CHAIN', 'OFF_CHAIN', 'DONE'];
                                        const currentIdx = subSteps.indexOf(deploySubstep);
                                        const thisIdx = subSteps.indexOf(sub);
                                        const isDone = thisIdx < currentIdx;
                                        const isCurrent = thisIdx === currentIdx;

                                        return (
                                            <div key={sub} className="flex items-center gap-3">
                                                <div className={`w-2 h-2 shrink-0 transition-colors duration-300 ${
                                                    isDone ? 'bg-green-500' :
                                                    isCurrent ? 'bg-[#ea580c] animate-pulse' :
                                                    'bg-zinc-300 dark:bg-zinc-700'
                                                }`} />
                                                <span className={`text-xs font-mono transition-colors duration-300 ${
                                                    isDone ? 'text-green-600 dark:text-green-400' :
                                                    isCurrent ? 'text-[#ea580c]' :
                                                    'text-zinc-400 dark:text-zinc-600'
                                                }`}>
                                                    {labels[sub]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Deploy / Back Buttons */}
                            <div className="flex gap-3">
                                {deploySubstep === 'IDLE' && (
                                    <button
                                        onClick={() => setStep('PROFILE_DETAILS')}
                                        className="px-4 py-4 text-sm font-mono tracking-wider uppercase border border-zinc-300 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-500 dark:hover:border-zinc-600 transition-colors duration-200"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={handleCreateAccount}
                                    disabled={isLoading || deploySubstep === 'DONE'}
                                    className="flex-1 flex items-center justify-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-4 text-sm font-mono tracking-wider uppercase font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {loadingMessage}
                                        </>
                                    ) : deploySubstep === 'DONE' ? (
                                        'Redirecting...'
                                    ) : (
                                        '[ Deploy Account ]'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex flex-col items-center justify-center p-6">
                <BrutalistLoader />
            </main>
        }>
            <OnboardingContent />
        </Suspense>
    );
}