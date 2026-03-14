'use client'

import React, { useEffect, useState, use } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Terminal, Loader2, AlertTriangle, ArrowLeft, Clock, CheckCircle2, XCircle, Coins, Plus } from 'lucide-react';
import { useGibmoniProgram } from '../../hooks/useAnchorQueries';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import Link from 'next/link';
import FloatingNav from '@/components/floatingNav';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const MILESTONE_TYPES = ['Design', 'Development', 'Testing', 'Deployment'];

type OffChainProject = {
    id: string;
    creatorWallet: string;
    title: string;
    tagline: string;
    description: string;
    category: string | null;
    coverImageUrl: string | null;
    createdAt: string;
    creatorAlias: string | null;
    milestones: {
        id: string;
        projectId: string;
        milestoneIndex: number;
        title: string;
        description: string;
        proofUrl: string | null;
        proofNotes: string | null;
        updatedAt: string | null;
    }[];
};

type OnChainProjectData = {
    projectAuthority: PublicKey;
    projectName: string;
    targetAmount: any;
    collectedAmount: any;
    withdrawnAmount: any;
    projectState: any;
    milestonesPosted: number;
    milestonesCompleted: number;
    fundingDeadline: any;
    deliveryDeadline: any;
    funderCount: number;
    bump: number;
};

type OnChainMilestoneData = {
    projectId: PublicKey;
    attemptNumber: number;
    milestoneStatus: any;
    milestoneType: any;
    votesCasted: number;
    capitalCasted: any;
    votingEndTime: any;
    voteAgainstWeight: any;
    voteForWeight: any;
    bump: number;
};

function getProjectState(state: any): string {
    if (state?.funding !== undefined) return 'Funding';
    if (state?.development !== undefined) return 'Development';
    if (state?.completed !== undefined) return 'Completed';
    if (state?.failed !== undefined) return 'Failed';
    return 'Unknown';
}

function getMilestoneStatus(status: any): string {
    if (status?.voting !== undefined) return 'Voting';
    if (status?.approved !== undefined) return 'Approved';
    if (status?.disapproved !== undefined) return 'Disapproved';
    return 'Unknown';
}

function getStateBadge(state: string) {
    const colors: Record<string, string> = {
        'Funding': 'border-[#ea580c] text-[#ea580c] bg-[#ea580c]/10',
        'Development': 'border-yellow-500 text-yellow-500 bg-yellow-500/10',
        'Completed': 'border-green-500 text-green-500 bg-green-500/10',
        'Failed': 'border-red-500 text-red-500 bg-red-500/10',
    };
    return colors[state] || 'border-zinc-500 text-zinc-500 bg-zinc-500/10';
}

function getMilestoneBadge(status: string) {
    const colors: Record<string, string> = {
        'Voting': 'border-yellow-500 text-yellow-500',
        'Approved': 'border-green-500 text-green-500',
        'Disapproved': 'border-red-500 text-red-500',
    };
    return colors[status] || 'border-zinc-500 text-zinc-500';
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { publicKey, connected } = useWallet();
    const { program, contributeFund, createMilestone, voteOnMilestone } = useGibmoniProgram();

    const [offChainData, setOffChainData] = useState<OffChainProject | null>(null);
    const [onChainData, setOnChainData] = useState<OnChainProjectData | null>(null);
    const [onChainMilestones, setOnChainMilestones] = useState<Map<number, OnChainMilestoneData>>(new Map());
    const [hasContribution, setHasContribution] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fund modal state
    const [showFundModal, setShowFundModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    // Milestone modal state
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [milestoneType, setMilestoneType] = useState(0);
    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [milestoneDescription, setMilestoneDescription] = useState('');
    // Vote modal state
    const [showVoteModal, setShowVoteModal] = useState(false);
    const [votingMilestoneIndex, setVotingMilestoneIndex] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);

    const projectPda = new PublicKey(id);

    // Fetch off-chain data
    useEffect(() => {
        async function fetchOffChain() {
            try {
                const res = await fetch(`${API_URL}/api/projects/${id}`);
                if (res.ok) {
                    setOffChainData(await res.json());
                }
                // Not an error if 404 — project may only exist on-chain
            } catch { }
        }
        fetchOffChain();
    }, [id]);

    // Fetch on-chain data
    useEffect(() => {
        async function fetchOnChain() {
            try {
                const projectAccount = await program.account.project.fetch(projectPda);
                setOnChainData(projectAccount as any);

                const msMap = new Map<number, OnChainMilestoneData>();
                for (let i = 0; i < 4; i++) {
                    try {
                        const [milestonePda] = PublicKey.findProgramAddressSync(
                            [
                                Buffer.from("MILESTONE"),
                                (projectAccount as any).projectAuthority.toBuffer(),
                                projectPda.toBuffer(),
                                Buffer.from([i]),
                            ],
                            program.programId
                        );
                        const msAccount = await program.account.milestone.fetch(milestonePda);
                        msMap.set(i, msAccount as any);
                    } catch { }
                }
                setOnChainMilestones(msMap);
            } catch (err) {
                console.warn('On-chain project not found:', err);
                setError('PROJECT_NOT_FOUND on chain.');
            } finally {
                setLoading(false);
            }
        }
        fetchOnChain();
    }, [id]);

    // Check contribution
    useEffect(() => {
        async function checkContribution() {
            if (!publicKey || !onChainData) return;
            try {
                const [contributionPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("CONTRIBUTION"), publicKey.toBuffer(), projectPda.toBuffer()],
                    program.programId
                );
                await program.account.contribution.fetch(contributionPda);
                setHasContribution(true);
            } catch {
                setHasContribution(false);
            }
        }
        checkContribution();
    }, [publicKey, onChainData]);

    // Derived values
    const projectState = onChainData ? getProjectState(onChainData.projectState) : 'Unknown';
    const projectTitle = offChainData?.title || onChainData?.projectName || 'Untitled Project';
    const targetSol = onChainData ? Number(onChainData.targetAmount) / LAMPORTS_PER_SOL : 0;
    const collectedSol = onChainData ? Number(onChainData.collectedAmount) / LAMPORTS_PER_SOL : 0;
    const withdrawnSol = onChainData ? Number(onChainData.withdrawnAmount) / LAMPORTS_PER_SOL : 0;
    const progress = targetSol > 0 ? Math.min((collectedSol / targetSol) * 100, 100) : 0;
    const isCreator = publicKey && onChainData && publicKey.equals(onChainData.projectAuthority);

    // ACTIONS
    const handleFund = async () => {
        if (!onChainData || !publicKey || !fundAmount) return;
        setActionLoading(true);
        try {
            const lamports = Math.floor(parseFloat(fundAmount) * LAMPORTS_PER_SOL);
            await contributeFund.mutateAsync({
                projectName: onChainData.projectName,
                projectAuthority: onChainData.projectAuthority,
                amount: new anchor.BN(lamports),
            });
            setShowFundModal(false);
            setFundAmount('');
            const updated = await program.account.project.fetch(projectPda);
            setOnChainData(updated as any);
            setHasContribution(true);
        } catch (err) {
            console.error('Fund error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateMilestone = async () => {
        if (!onChainData || !publicKey) return;
        setActionLoading(true);
        const milestoneTypeEnum = [{ design: {} }, { development: {} }, { testing: {} }, { deployment: {} }];
        try {
            await createMilestone.mutateAsync({
                projectName: onChainData.projectName,
                milestoneType: milestoneTypeEnum[milestoneType],
                typeIndex: milestoneType,
            });

            const [milestonePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("MILESTONE"), publicKey.toBuffer(), projectPda.toBuffer(), Buffer.from([milestoneType])],
                program.programId
            );

            await fetch(`${API_URL}/api/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: milestonePda.toBase58(),
                    projectId: id,
                    milestoneIndex: milestoneType,
                    title: milestoneTitle,
                    description: milestoneDescription,
                }),
            });

            setShowMilestoneModal(false);
            setMilestoneTitle('');
            setMilestoneDescription('');
            const updated = await program.account.project.fetch(projectPda);
            setOnChainData(updated as any);
            try {
                const msAccount = await program.account.milestone.fetch(milestonePda);
                setOnChainMilestones(prev => new Map(prev).set(milestoneType, msAccount as any));
            } catch { }
        } catch (err) {
            console.error('Create milestone error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleVote = async (decision: boolean) => {
        if (!onChainData || !publicKey) return;
        setActionLoading(true);
        try {
            await voteOnMilestone.mutateAsync({
                projectName: onChainData.projectName,
                projectAuthority: onChainData.projectAuthority,
                typeIndex: votingMilestoneIndex,
                decision,
            });
            setShowVoteModal(false);
            try {
                const [msPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("MILESTONE"), onChainData.projectAuthority.toBuffer(), projectPda.toBuffer(), Buffer.from([votingMilestoneIndex])],
                    program.programId
                );
                const msAccount = await program.account.milestone.fetch(msPda);
                setOnChainMilestones(prev => new Map(prev).set(votingMilestoneIndex, msAccount as any));
            } catch { }
        } catch (err) {
            console.error('Vote error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <FloatingNav />
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin mx-auto mb-4" />
                    <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">LOADING PROJECT NODE...</p>
                </div>
            </main>
        );
    }

    if (error && !onChainData) {
        return (
            <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
                <FloatingNav />
                <div className="border-2 border-red-500/30 p-12 max-w-md text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <p className="text-sm font-mono text-red-500 mb-6">{error}</p>
                    <Link href="/dashboard" className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-[#ea580c] transition-colors">
                        ← BACK TO EXPLORE
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 px-6 lg:px-12 py-12 pb-28">
            <FloatingNav />

            <div className="max-w-5xl mx-auto">
                {/* Back link */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400 hover:text-[#ea580c] transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" />
                    BACK TO EXPLORE
                </Link>

                {/* Project Header */}
                <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <Terminal className="w-5 h-5 text-[#ea580c]" />
                                <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                                    PROJECT // {id.slice(0, 8)}...{id.slice(-4)}
                                </span>
                                <span className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 border ${getStateBadge(projectState)}`}>
                                    {projectState}
                                </span>
                            </div>

                            {offChainData?.category && (
                                <span className="text-[9px] font-mono tracking-widest uppercase text-[#ea580c] mb-3 block">
                                    {offChainData.category}
                                </span>
                            )}
                            <h1 className="font-pixel text-3xl lg:text-5xl text-zinc-900 dark:text-zinc-100 uppercase mb-4">
                                {projectTitle}
                            </h1>
                            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                                {offChainData?.tagline || ''}
                            </p>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                <span>by <span className="text-zinc-700 dark:text-zinc-300">{offChainData?.creatorAlias || onChainData?.projectAuthority.toBase58().slice(0, 8) + '...'}</span></span>
                                {onChainData && <span>{onChainData.funderCount} funder{onChainData.funderCount !== 1 ? 's' : ''}</span>}
                            </div>
                        </div>

                        {/* Vault Stats */}
                        {onChainData && (
                            <div className="w-full lg:w-80 border border-zinc-300 dark:border-zinc-800 p-6">
                                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-4">VAULT STATUS</span>
                                <div className="flex justify-between mb-3">
                                    <span className="text-3xl font-mono font-bold text-[#ea580c]">{collectedSol.toFixed(2)}</span>
                                    <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500 self-end">/ {targetSol.toFixed(2)} SOL</span>
                                </div>
                                <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 mb-3">
                                    <div className="h-full bg-[#ea580c] transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                                    <span>{progress.toFixed(1)}% funded</span>
                                    <span>{withdrawnSol.toFixed(2)} withdrawn</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {offChainData?.description && (
                    <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 mb-6">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-6">PROJECT // README</span>
                        <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap max-w-3xl">
                            {offChainData.description}
                        </div>
                    </div>
                )}

                {/* Milestone Timeline */}
                <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 mb-6">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-8">MILESTONES // TIMELINE</span>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {MILESTONE_TYPES.map((type, index) => {
                            const onChainMs = onChainMilestones.get(index);
                            const offChainMs = offChainData?.milestones?.find(m => m.milestoneIndex === index);
                            const status = onChainMs ? getMilestoneStatus(onChainMs.milestoneStatus) : 'Pending';
                            const isActive = onChainMs !== undefined;
                            const isVoting = status === 'Voting';

                            return (
                                <div
                                    key={index}
                                    className={`border border-zinc-300 dark:border-zinc-800 p-5 relative ${
                                        isActive ? 'bg-zinc-50 dark:bg-zinc-900/30' : 'bg-zinc-100/50 dark:bg-zinc-950/50 opacity-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                                            MS-{index}
                                        </span>
                                        {isActive ? (
                                            <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 border ${getMilestoneBadge(status)}`}>
                                                {status}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-600">
                                                PENDING
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="font-pixel text-sm text-zinc-900 dark:text-zinc-100 uppercase mb-2">{type}</h4>

                                    {offChainMs && (
                                        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                                            {offChainMs.title}
                                        </p>
                                    )}

                                    {isActive && onChainMs && (
                                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-3">
                                            <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                                                <span>For: {Number(onChainMs.voteForWeight)}</span>
                                                <span>Against: {Number(onChainMs.voteAgainstWeight)}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px] font-mono text-zinc-400 mt-1">
                                                <span>Votes: {onChainMs.votesCasted}</span>
                                                <span>Attempt: {onChainMs.attemptNumber}/3</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status icon */}
                                    <div className="absolute top-5 right-5">
                                        {status === 'Approved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        {status === 'Disapproved' && <XCircle className="w-4 h-4 text-red-500" />}
                                        {isVoting && <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />}
                                    </div>

                                    {/* Vote button */}
                                    {isVoting && hasContribution && connected && !isCreator && (
                                        <button
                                            onClick={() => { setVotingMilestoneIndex(index); setShowVoteModal(true); }}
                                            className="mt-4 w-full py-2.5 text-[9px] font-mono tracking-widest uppercase border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all"
                                        >
                                            [ CAST_VOTE ]
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Panel */}
                {connected && onChainData && (
                    <div className="border-2 border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-6">ACTIONS // EXECUTE</span>
                        <div className="flex flex-wrap gap-4">
                            {projectState === 'Funding' && (
                                <button
                                    onClick={() => setShowFundModal(true)}
                                    className="flex items-center gap-2 px-6 py-3.5 border border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c] hover:text-white text-[10px] font-mono tracking-widest uppercase transition-all duration-200"
                                >
                                    <Coins className="w-3.5 h-3.5" />
                                    [ FUND_PROJECT ]
                                </button>
                            )}
                            {projectState === 'Development' && isCreator && onChainData.milestonesPosted < 4 && (
                                <button
                                    onClick={() => setShowMilestoneModal(true)}
                                    className="flex items-center gap-2 px-6 py-3.5 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white text-[10px] font-mono tracking-widest uppercase transition-all duration-200"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    [ ADD_MILESTONE ]
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== FUND MODAL ===== */}
                {showFundModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setShowFundModal(false)} />
                        <div className="w-full max-w-sm bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 shadow-[8px_8px_0_0_#27272a] relative z-10">
                            <div className="px-5 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">FUND // ESCROW</span>
                            </div>
                            <div className="p-6">
                                <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400 block mb-2">
                                    Amount (SOL) <span className="text-[#ea580c]">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.001"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none mb-4"
                                    placeholder="1.0"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleFund}
                                        disabled={actionLoading || !fundAmount}
                                        className="flex-1 bg-[#ea580c] text-white py-3 text-[10px] font-mono tracking-widest uppercase hover:bg-[#c2410c] transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading ? 'SIGNING...' : '[ CONFIRM ]'}
                                    </button>
                                    <button
                                        onClick={() => setShowFundModal(false)}
                                        className="px-4 py-3 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                    >
                                        [ CANCEL ]
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MILESTONE MODAL ===== */}
                {showMilestoneModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setShowMilestoneModal(false)} />
                        <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 shadow-[8px_8px_0_0_#27272a] relative z-10">
                            <div className="px-5 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">MILESTONE // SUBMIT</span>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Type *</label>
                                    <select
                                        value={milestoneType}
                                        onChange={(e) => setMilestoneType(parseInt(e.target.value))}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none appearance-none"
                                    >
                                        {MILESTONE_TYPES.map((type, i) => (
                                            <option key={type} value={i} disabled={onChainMilestones.has(i)}>{type}{onChainMilestones.has(i) ? ' (exists)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Title *</label>
                                    <input
                                        type="text" maxLength={100} value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none"
                                        placeholder="e.g. UI wireframes complete"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Description *</label>
                                    <textarea
                                        rows={3} maxLength={2000} value={milestoneDescription} onChange={(e) => setMilestoneDescription(e.target.value)}
                                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-all rounded-none resize-none"
                                        placeholder="Describe the deliverable..."
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleCreateMilestone} disabled={actionLoading || !milestoneTitle || !milestoneDescription}
                                        className="flex-1 bg-yellow-500 text-white py-3 text-[10px] font-mono tracking-widest uppercase hover:bg-yellow-600 transition-colors disabled:opacity-50">
                                        {actionLoading ? 'SIGNING...' : '[ DEPLOY ]'}
                                    </button>
                                    <button onClick={() => setShowMilestoneModal(false)}
                                        className="px-4 py-3 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                        [ CANCEL ]
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== VOTE MODAL ===== */}
                {showVoteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setShowVoteModal(false)} />
                        <div className="w-full max-w-sm bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 shadow-[8px_8px_0_0_#27272a] relative z-10">
                            <div className="px-5 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">VOTE // MS-{votingMilestoneIndex} ({MILESTONE_TYPES[votingMilestoneIndex]})</span>
                            </div>
                            <div className="p-6">
                                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-6">
                                    Cast your governance vote. Weight is determined by contribution amount and reputation score.
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVote(true)} disabled={actionLoading}
                                        className="flex-1 bg-green-600 text-white py-3 text-[10px] font-mono tracking-widest uppercase hover:bg-green-700 transition-colors disabled:opacity-50">
                                        {actionLoading ? '...' : '[ APPROVE ]'}
                                    </button>
                                    <button onClick={() => handleVote(false)} disabled={actionLoading}
                                        className="flex-1 bg-red-600 text-white py-3 text-[10px] font-mono tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-50">
                                        {actionLoading ? '...' : '[ REJECT ]'}
                                    </button>
                                </div>
                                <button onClick={() => setShowVoteModal(false)}
                                    className="mt-3 w-full py-2 text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                    [ CANCEL ]
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
