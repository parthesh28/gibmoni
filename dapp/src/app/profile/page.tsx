'use client'

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Terminal, Loader2, User, Briefcase, Coins, Vote, Trophy, ExternalLink, LogOut, AlertTriangle } from 'lucide-react';
import { useGibmoniProgram } from '../hooks/useAnchorQueries';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletButton } from '../context/solanaProvider';
import FloatingNav from '@/components/floatingNav';

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

export default function ProfilePage() {
    const { publicKey, connected, disconnect } = useWallet();
    const { program, getUserAccount, initializeUser } = useGibmoniProgram();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [createdProjects, setCreatedProjects] = useState<CreatedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetched, setFetched] = useState(false);
    const [initPdaLoading, setInitPdaLoading] = useState(false);

    // Stabilize programId to avoid infinite re-renders
    const programId = program.programId.toBase58();

    const fetchOffChainData = useCallback(async () => {
        if (!publicKey || fetched) return;
        setLoading(true);
        const wallet = publicKey.toBase58();

        // Fetch off-chain profile
        try {
            const userRes = await fetch(`${API_URL}/api/users/${wallet}`);
            if (userRes.ok) {
                setProfile(await userRes.json());
            }
        } catch { }

        // Fetch created projects
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

    // Handle initialize user PDA
    const handleInitPda = async () => {
        setInitPdaLoading(true);
        try {
            await initializeUser.mutateAsync();
            // Refetch the user account query
            getUserAccount.refetch();
        } catch (err) {
            console.error('Init PDA error:', err);
        } finally {
            setInitPdaLoading(false);
        }
    };

    // Derived on-chain data from the reactive query
    const onChainUser = getUserAccount.data;
    const hasOnChainUser = !!onChainUser && !getUserAccount.isError;
    const onChainLoading = getUserAccount.isLoading;

    // Not connected
    if (!connected || !publicKey) {
        return (
            <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
                <FloatingNav />
                <div className="w-full max-w-md border-2 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                        <Terminal className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                            PROFILE.SYS // AUTH_REQUIRED
                        </span>
                    </div>
                    <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-6 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                            <User className="w-6 h-6 text-zinc-400" />
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
            <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <FloatingNav />
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin mx-auto mb-4" />
                    <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">LOADING PROFILE DATA...</p>
                </div>
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

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 px-6 lg:px-12 py-12 pb-28">
            <FloatingNav />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Terminal className="w-5 h-5 text-[#ea580c]" />
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                            PROFILE.SYS // {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
                        </span>
                        <div className="w-2 h-2 bg-[#ea580c] animate-pulse"></div>
                    </div>
                </div>

                {/* On-chain PDA Init Banner — shown if no User PDA found */}
                {!hasOnChainUser && (
                    <div className="border-2 border-yellow-500/50 bg-yellow-500/5 p-8 lg:p-10 mb-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-pixel text-lg text-zinc-900 dark:text-zinc-100 uppercase mb-2">
                                    On-Chain Profile Not Found
                                </h3>
                                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    Your wallet is connected but no User PDA was found on-chain. Initialize your on-chain profile to start creating projects, funding, and voting.
                                </p>
                                <button
                                    onClick={handleInitPda}
                                    disabled={initPdaLoading}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-[#ea580c] text-white text-[10px] font-mono tracking-widest uppercase hover:bg-[#c2410c] transition-colors disabled:opacity-50"
                                >
                                    {initPdaLoading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            SIGNING TX...
                                        </>
                                    ) : (
                                        '[ INITIALIZE ON-CHAIN PROFILE ]'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Info + Disconnect */}
                <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 mb-6">
                    <div className="flex items-start gap-6 lg:gap-8">
                        <div className="w-20 h-20 border-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50 flex items-center justify-center shrink-0">
                            <User className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-pixel text-3xl lg:text-4xl text-zinc-900 dark:text-zinc-100 uppercase mb-2">
                                {profile?.alias || 'Anonymous'}
                            </h1>
                            <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mb-4 break-all">
                                {publicKey.toBase58()}
                            </p>
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
                                className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-mono tracking-widest uppercase transition-all duration-200"
                            >
                                <LogOut className="w-3 h-3" />
                                [ DISCONNECT ]
                            </button>
                        </div>
                    </div>
                </div>

                {/* On-chain Stats — only show if PDA exists */}
                {hasOnChainUser && (
                    <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 mb-6">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-8">ON-CHAIN STATS // LEDGER</span>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                            {[
                                { label: 'SOL Contributed', value: contributedSol.toFixed(2), icon: Coins, color: 'text-[#ea580c]' },
                                { label: 'Votes Cast', value: votesCasted.toString(), icon: Vote, color: 'text-yellow-500' },
                                { label: 'Projects Posted', value: projectsPosted.toString(), icon: Briefcase, color: 'text-blue-500' },
                                { label: 'Projects Succeeded', value: projectsSucceeded.toString(), icon: Trophy, color: 'text-green-500' },
                            ].map((stat, i) => (
                                <div key={i} className="border border-zinc-300 dark:border-zinc-800 p-5 text-center">
                                    <stat.icon className={`w-5 h-5 mx-auto mb-3 ${stat.color}`} />
                                    <div className={`text-3xl font-mono font-bold ${stat.color} mb-1`}>{stat.value}</div>
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
                <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 mb-6">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-6">PROJECTS // CREATED</span>

                    {createdProjects.length === 0 ? (
                        <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-500 mb-6">No projects created yet.</p>
                            <Link href="/create" className="text-xs font-mono tracking-widest uppercase text-[#ea580c] hover:underline">
                                [ INIT_PROJECT ]
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {createdProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/project/${project.id}`}
                                    className="flex items-center justify-between p-5 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all group"
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
                                    <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-[#ea580c] transition-colors shrink-0 ml-4" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Funded Projects */}
                <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-4">PROJECTS // FUNDED</span>
                    <p className="text-sm font-mono text-zinc-500 dark:text-zinc-500 leading-relaxed">
                        Funded projects are determined by on-chain Contribution PDAs. Visit the{' '}
                        <Link href="/dashboard" className="text-[#ea580c] hover:underline">Explore</Link>
                        {' '}page to view projects you have contributed to.
                    </p>
                    {contributedSol > 0 && (
                        <div className="mt-4 p-4 border border-[#ea580c]/30 bg-[#ea580c]/5">
                            <span className="text-sm font-mono text-[#ea580c]">
                                Total on-chain contributions: {contributedSol.toFixed(4)} SOL across all projects
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
