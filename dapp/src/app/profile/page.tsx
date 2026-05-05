'use client'

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGibmoniProgram } from '../hooks/useAnchorQueries';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletButton } from '../context/solanaProvider';
import FloatingNav from '@/components/floatingNav';
import { BrutalistLoader } from '@/components/brutalistLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

type UserProfile = {
    walletAddress: string;
    alias: string;
    avatarUrl: string | null;
    githubUrl: string | null;
    twitterHandle: string | null;
    bio: string | null;
    createdAt: string;
    githubScore: number;
    walletScore: number;
};

type CreatedProject = {
    id: string;
    title: string;
    tagline: string;
    category: string | null;
    createdAt: string;
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };
    return (
        <button
            onClick={handleCopy}
            className="ml-2 text-[9px] font-mono tracking-widest uppercase text-zinc-400 hover:text-[#ea580c] transition-colors duration-200 shrink-0"
            title="Copy to clipboard"
        >
            {copied ? '[ COPIED ]' : '[ COPY ]'}
        </button>
    );
}

export default function ProfilePage() {
    const { publicKey, connected, disconnect } = useWallet();
    const { program, getUserAccount } = useGibmoniProgram();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [createdProjects, setCreatedProjects] = useState<CreatedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetched, setFetched] = useState(false);

    const fetchOffChainData = useCallback(async () => {
        if (!publicKey || fetched) return;
        setLoading(true);
        const wallet = publicKey.toBase58();

        try {
            const userRes = await fetch(`${API_URL}/api/users/${wallet}`);
            if (userRes.ok) {
                setProfile(await userRes.json());
            }
        } catch { }

        try {
            const projRes = await fetch(`${API_URL}/api/users/${wallet}/projects`);
            if (projRes.ok) {
                const data = await projRes.json();
                setCreatedProjects(data.created || []);
            }
        } catch { }

        setLoading(false);
        setFetched(true);
    }, [publicKey, fetched]);

    useEffect(() => {
        if (!connected || !publicKey) {
            setLoading(false);
            return;
        }
        fetchOffChainData();
    }, [connected, publicKey, fetchOffChainData]);

    const handleInitPda = () => {
        window.location.href = '/onboarding';
    };

    const onChainUser = getUserAccount.data;
    const hasOnChainUser = !!onChainUser && !getUserAccount.isError;
    const onChainLoading = getUserAccount.isLoading;

    // Not connected
    if (!connected || !publicKey) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300">
                <FloatingNav />
                <div className="w-full max-w-md border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                            PROFILE // AUTH_REQUIRED
                        </span>
                    </div>
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                            <span className="text-lg font-mono text-zinc-400">?</span>
                        </div>
                        <h2 className="font-pixel text-xl text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                            Connect Wallet
                        </h2>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-8">
                            Connect your wallet to view your on-chain profile and activity stats.
                        </p>
                        <WalletButton />
                    </div>
                </div>
            </main>
        );
    }

    if (loading || onChainLoading) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-6">
                <FloatingNav />
                <BrutalistLoader text="FETCHING PROFILE DATA..." />
            </main>
        );
    }

    const contributedSol = onChainUser ? Number(onChainUser.contributedAmount) / LAMPORTS_PER_SOL : 0;
    const votesCasted = onChainUser ? Number(onChainUser.votesCasted) : 0;
    const projectsPosted = onChainUser ? Number(onChainUser.projectsPosted) : 0;
    const projectsSucceeded = onChainUser ? Number(onChainUser.projectsSucceeded) : 0;
    const milestonesSucceeded = onChainUser ? Number(onChainUser.milestonesSucceeded) : 0;
    const timeJoined = onChainUser ? new Date(Number(onChainUser.timeJoined) * 1000).toLocaleDateString() : 'N/A';
    const lastActive = onChainUser ? new Date(Number(onChainUser.lastActiveTime) * 1000).toLocaleDateString() : 'N/A';
    const walletScore = onChainUser ? Number(onChainUser.initialWalletScore) : (profile?.walletScore || 0);
    const githubScore = onChainUser ? Number(onChainUser.initialGithubScore) : (profile?.githubScore || 0);
    const walletAddress = publicKey.toBase58();

    // Replicate the contract's reputation formula (from vote_on_milestone.rs)
    const computedReputation = (() => {
        if (!onChainUser) return 0;
        const solContributed = Math.floor(Number(onChainUser.contributedAmount) / 1_000_000_000);
        const failedProjects = Math.max(projectsPosted - projectsSucceeded, 0);
        const rawScore = Math.max(
            votesCasted + (milestonesSucceeded * 5) + (projectsSucceeded * 20) + solContributed - (failedProjects * 10),
            0
        );
        const MAX_BONUS = 9;
        const HALF_LIFE = 100;
        const baseRep = rawScore > 0 ? 1 + Math.min(MAX_BONUS, Math.floor((MAX_BONUS * rawScore) / (rawScore + HALF_LIFE))) : 1;
        const lastActiveTime = Number(onChainUser.lastActiveTime);
        const now = Math.floor(Date.now() / 1000);
        const daysInactive = Math.max(Math.floor((now - lastActiveTime) / 86400), 0);
        const decayed = Math.max(Math.floor((HALF_LIFE * baseRep) / (HALF_LIFE + daysInactive)), 1);
        if (votesCasted <= 10) {
            const offChainSum = walletScore + githubScore;
            const boostBps = Math.floor((offChainSum * 25) / 100);
            return Math.floor((decayed * (10000 + boostBps)) / 10000);
        }
        return decayed;
    })();

    return (
        <main className="min-h-screen transition-colors duration-300 px-4 sm:px-6 lg:px-12 pt-24 pb-28">
            <FloatingNav />

            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                {/* Header breadcrumb */}
                <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                        PROFILE // {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                </div>

                {/* On-chain PDA Init Banner */}
                {!hasOnChainUser && (
                    <div className="border-2 border-[#ea580c]/30 bg-[#ea580c]/5 p-8 lg:p-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-pixel text-lg text-zinc-900 dark:text-zinc-100 uppercase mb-2">
                                    On-Chain Profile Not Found
                                </h3>
                                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    Your wallet is connected but no User PDA was found on-chain. Complete the onboarding process to create your on-chain profile.
                                </p>
                            </div>
                            <button
                                onClick={handleInitPda}
                                className="px-6 py-3.5 bg-[#ea580c] text-white text-[10px] font-mono tracking-widest uppercase hover:bg-[#c2410c] transition-colors shrink-0"
                            >
                                GO TO ONBOARDING
                            </button>
                        </div>
                    </div>
                )}

                {/* Profile Info + Disconnect */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                    <div className="flex flex-col sm:flex-row items-start gap-6 lg:gap-8">
                        {/* Avatar placeholder */}
                        <div className="w-20 h-20 border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-pixel text-zinc-400 dark:text-zinc-600 uppercase">
                                {(profile?.alias || 'A')[0]}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-pixel text-3xl lg:text-4xl text-zinc-900 dark:text-zinc-100 uppercase mb-2">
                                {profile?.alias || 'Anonymous'}
                            </h1>
                            <div className="flex items-center gap-1 mb-4">
                                <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 break-all">
                                    {walletAddress}
                                </p>
                                <CopyButton text={walletAddress} />
                            </div>
                            {profile?.bio && (
                                <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mb-4">
                                    {profile.bio}
                                </p>
                            )}

                            {/* Social links */}
                            {(profile?.githubUrl || profile?.twitterHandle) && (
                                <div className="flex items-center gap-4 mb-4">
                                    {profile.githubUrl && (
                                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-[#ea580c] transition-colors">
                                            GITHUB ↗
                                        </a>
                                    )}
                                    {profile.twitterHandle && (
                                        <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer"
                                            className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-[#ea580c] transition-colors">
                                            @{profile.twitterHandle} ↗
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Disconnect Button */}
                            <button
                                onClick={() => disconnect()}
                                className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-mono tracking-widest uppercase transition-all duration-200"
                            >
                                DISCONNECT
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scores & Reputation — always show if PDA exists */}
                {hasOnChainUser && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-6 border-l-4 border-l-[#ea580c]">
                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-3">WALLET SCORE</span>
                            <span className="text-3xl font-mono font-bold text-[#ea580c]">{walletScore}</span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-6 border-l-4 border-l-zinc-900 dark:border-l-zinc-100">
                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-3">GITHUB SCORE</span>
                            <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{githubScore}</span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-6 border-l-4 border-l-yellow-500">
                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-3">REPUTATION</span>
                            <span className="text-3xl font-mono font-bold text-yellow-500">{computedReputation}</span>
                        </div>
                    </div>
                )}

                {/* On-chain Stats */}
                {hasOnChainUser && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-8">ON-CHAIN STATS</span>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'SOL Contributed', value: contributedSol.toFixed(2), color: 'text-[#ea580c]' },
                                { label: 'Votes Cast', value: votesCasted.toString(), color: 'text-yellow-500' },
                                { label: 'Projects Posted', value: projectsPosted.toString(), color: 'text-zinc-900 dark:text-zinc-100' },
                                { label: 'Projects Succeeded', value: projectsSucceeded.toString(), color: 'text-green-500' },
                            ].map((stat, i) => (
                                <div key={i} className="border border-zinc-300 dark:border-zinc-800 p-5 text-center">
                                    <div className={`text-3xl font-mono font-bold ${stat.color} mb-2`}>{stat.value}</div>
                                    <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Milestones Succeeded', value: milestonesSucceeded.toString() },
                                { label: 'Joined', value: timeJoined },
                                { label: 'Last Active', value: lastActive },
                            ].map((stat, i) => (
                                <div key={i} className="border border-zinc-300 dark:border-zinc-800 p-4 flex items-center justify-between">
                                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500">{stat.label}</span>
                                    <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Created Projects */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                            PROJECTS // CREATED
                        </span>
                        {createdProjects.length > 0 && (
                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400">
                                {createdProjects.length} project{createdProjects.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {createdProjects.length === 0 ? (
                        <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
                            {projectsPosted > 0 ? (
                                <>
                                    <p className="text-sm font-mono text-zinc-500 mb-2">
                                        {projectsPosted} project{projectsPosted !== 1 ? 's' : ''} found on-chain but not indexed off-chain.
                                    </p>
                                    <p className="text-[10px] font-mono text-zinc-400 mb-6">
                                        Visit the Explore page to find your projects by wallet address.
                                    </p>
                                    <Link href="/dashboard" className="px-6 py-3 border border-[#ea580c] text-[#ea580c] text-[10px] font-mono tracking-widest uppercase hover:bg-[#ea580c] hover:text-white transition-colors">
                                        EXPLORE PROJECTS
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-mono text-zinc-500 mb-6">No projects created yet.</p>
                                    <Link href="/create" className="px-6 py-3 bg-[#ea580c] text-white text-[10px] font-mono tracking-widest uppercase hover:bg-[#c2410c] transition-colors">
                                        CREATE PROJECT
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {createdProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/project/${project.id}`}
                                    className="group flex items-start sm:items-center justify-between p-5 border border-zinc-300 dark:border-zinc-800 hover:border-[#ea580c]/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-all duration-200"
                                >
                                    <div className="flex-1 min-w-0">
                                        {project.category && (
                                            <span className="text-[9px] font-mono tracking-widest uppercase text-[#ea580c] block mb-1">
                                                {project.category}
                                            </span>
                                        )}
                                        <h4 className="font-pixel text-sm text-zinc-900 dark:text-zinc-100 uppercase truncate mb-0.5">
                                            {project.title}
                                        </h4>
                                        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                                            {project.tagline}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <CopyButton text={project.id} />
                                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-[#ea580c] transition-colors">
                                            →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Funded Projects */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-4">PROJECTS // FUNDED</span>
                    <p className="text-sm font-mono text-zinc-500 leading-relaxed">
                        Funded projects are determined by on-chain Contribution PDAs. Visit the{' '}
                        <Link href="/dashboard" className="text-[#ea580c] hover:underline">Explore</Link>
                        {' '}page to view projects you have contributed to.
                    </p>
                    {contributedSol > 0 && (
                        <div className="mt-4 p-4 border border-[#ea580c]/30 bg-[#ea580c]/5">
                            <span className="text-sm font-mono text-[#ea580c]">
                                Total on-chain contributions: {contributedSol.toFixed(4)} SOL
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
