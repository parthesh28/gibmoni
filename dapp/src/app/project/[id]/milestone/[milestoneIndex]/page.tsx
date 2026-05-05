'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGibmoniProgram } from '../../../../hooks/useAnchorQueries';
import { PublicKey } from '@solana/web3.js';
import { BrutalistLoader } from '@/components/brutalistLoader';
import Footer from '@/components/footer';
import { ArrowLeft } from 'lucide-react';

const MILESTONE_TYPES = ['Design', 'Development', 'Testing', 'Deployment'];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
    };
    return (
        <button onClick={handleCopy} className="ml-2 text-[9px] font-mono tracking-widest uppercase text-zinc-400 hover:text-[#ea580c] transition-colors duration-200 shrink-0" title="Copy">
            {copied ? '[ COPIED ]' : '[ COPY ]'}
        </button>
    );
}

function getMilestoneStatus(statusObj: any): string {
    if (statusObj?.approved !== undefined) return 'Approved';
    if (statusObj?.disapproved !== undefined) return 'Disapproved';
    if (statusObj?.voting !== undefined) return 'Voting';
    if (statusObj?.pending !== undefined) return 'Pending';
    return 'Pending';
}

function getMilestoneBadge(status: string) {
    switch (status) {
        case 'Approved': return 'border-green-500 text-green-500';
        case 'Disapproved': return 'border-red-500 text-red-500';
        case 'Voting': return 'border-yellow-500 text-yellow-500';
        default: return 'border-zinc-500 text-zinc-500';
    }
}

export default function MilestoneDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const index = parseInt(params.milestoneIndex as string, 10);
    
    const { connected, publicKey } = useWallet();
    const { program, voteOnMilestone, retryMilestone } = useGibmoniProgram();

    const [loading, setLoading] = useState(true);
    const [projectOffChain, setProjectOffChain] = useState<any>(null);
    const [milestoneOffChain, setMilestoneOffChain] = useState<any>(null);
    
    const [onChainData, setOnChainData] = useState<any>(null);
    const [onChainMs, setOnChainMs] = useState<any>(null);
    const [milestonePdaKey, setMilestonePdaKey] = useState<string>('');
    
    const [hasContribution, setHasContribution] = useState(false);
    const [userVoted, setUserVoted] = useState(false);
    const [isCreator, setIsCreator] = useState(false);

    // Fetch off-chain and base on-chain data
    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            if (!program) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${id}`);
                if (!res.ok) throw new Error('Failed to fetch project from API');
                const apiData = await res.json();
                if (mounted) {
                    setProjectOffChain(apiData);
                    const ms = apiData.milestones?.find((m: any) => m.milestoneIndex === index);
                    setMilestoneOffChain(ms || null);
                }

                const projectPda = new PublicKey(id);
                const projAccount = await program.account.project.fetch(projectPda);
                if (mounted) setOnChainData(projAccount);

                const [milestonePda] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("MILESTONE"),
                        (projAccount as any).projectAuthority.toBuffer(),
                        projectPda.toBuffer(),
                        Buffer.from([index])
                    ],
                    program.programId
                );
                if (mounted) setMilestonePdaKey(milestonePda.toBase58());

                try {
                    const msAccount = await program.account.milestone.fetch(milestonePda);
                    if (mounted) setOnChainMs(msAccount);
                } catch {
                    if (mounted) setOnChainMs(null);
                }
            } catch (err) {
                console.error("Error loading milestone base data", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadData();
        return () => { mounted = false; };
    }, [id, index]);

    // Fetch user-specific state
    useEffect(() => {
        let mounted = true;
        const loadUserData = async () => {
            if (!program || !publicKey || !onChainData || !onChainMs) {
                if (mounted) { setIsCreator(false); setHasContribution(false); setUserVoted(false); }
                return;
            }
            try {
                setIsCreator(onChainData.projectAuthority.toBase58() === publicKey.toBase58());
                const projectPda = new PublicKey(id);
                
                const [contributionPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("CONTRIBUTION"), publicKey.toBuffer(), projectPda.toBuffer()],
                    program.programId
                );
                try {
                    await program.account.contribution.fetch(contributionPda);
                    if (mounted) setHasContribution(true);
                } catch {
                    if (mounted) setHasContribution(false);
                }

                const [milestonePda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("MILESTONE"), (onChainData as any).projectAuthority.toBuffer(), projectPda.toBuffer(), Buffer.from([index])],
                    program.programId
                );
                const [votePda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("VOTE"), milestonePda.toBuffer(), publicKey.toBuffer()],
                    program.programId
                );
                try {
                    const voteAccount = await program.account.vote.fetch(votePda);
                    if (mounted) setUserVoted(Number(voteAccount.attemptCount) === Number((onChainMs as any).attemptNumber));
                } catch {
                    if (mounted) setUserVoted(false);
                }
            } catch (err) {
                console.error("Error loading user state", err);
            }
        };
        loadUserData();
        return () => { mounted = false; };
    }, [id, index, publicKey, onChainData, onChainMs]);

    if (loading) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300">
                <BrutalistLoader text="FETCHING MILESTONE DATA..." />
            </main>
        );
    }

    if (!projectOffChain || !onChainData) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center mb-6 text-zinc-500">
                        {'//'}
                    </div>
                    <h2 className="font-pixel text-xl text-zinc-800 dark:text-zinc-200 uppercase mb-2">Project Not Found</h2>
                    <Link href="/dashboard" className="mt-4 text-xs font-mono text-[#ea580c] hover:underline uppercase tracking-widest">
                        RETURN TO EXPLORE
                    </Link>
                </div>
            </main>
        );
    }

    const isActive = onChainMs !== null;
    const status = onChainMs ? getMilestoneStatus(onChainMs.milestoneStatus) : 'Pending';
    const isVoting = status === 'Voting';
    const isDisapproved = status === 'Disapproved';
    const isApproved = status === 'Approved';
    const authorityKey = onChainData.projectAuthority.toBase58();

    const handleVote = async (voteFor: boolean) => {
        try {
            await voteOnMilestone.mutateAsync({
                projectName: onChainData.projectName,
                projectAuthority: onChainData.projectAuthority,
                typeIndex: index,
                decision: voteFor,
            });
            setUserVoted(true);
            router.refresh();
        } catch (error) {
            console.error("Voting failed", error);
        }
    };

    const handleRetry = async () => {
        try {
            await retryMilestone.mutateAsync({
                projectName: onChainData.projectName,
                projectAuthority: onChainData.projectAuthority,
                typeIndex: index,
            });
            router.refresh();
        } catch (error) {
            console.error("Retry failed", error);
        }
    };

    return (
        <main className="min-h-screen transition-colors duration-300 px-4 sm:px-6 lg:px-12 pt-24 pb-28">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                
                {/* Back Navigation */}
                <Link 
                    href={`/project/${id}`}
                    className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-max"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    BACK TO PROJECT
                </Link>

                {/* Header Section */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                                MILESTONE // {index}
                            </span>
                            {isActive ? (
                                <span className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 border ${getMilestoneBadge(status)}`}>
                                    {status}
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 border border-zinc-500 text-zinc-500">
                                    PENDING
                                </span>
                            )}
                        </div>
                        <h1 className="font-pixel text-3xl md:text-5xl text-zinc-900 dark:text-zinc-100 uppercase">
                            {MILESTONE_TYPES[index]} PHASE
                        </h1>
                        <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                            {milestoneOffChain?.title || `The ${MILESTONE_TYPES[index]} phase of ${projectOffChain.title}.`}
                        </p>
                    </div>

                    {/* Attempt Status Box */}
                    {isActive && (
                        <div className="border border-zinc-300 dark:border-zinc-800 p-4 shrink-0 w-full md:w-auto">
                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-2">CURRENT ATTEMPT</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-mono text-[#ea580c] font-bold">{onChainMs.attemptNumber}</span>
                                <span className="text-sm font-mono text-zinc-500">/ 3</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    
                    {/* Left Column */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        {milestoneOffChain?.description && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-6">DESCRIPTION // PROOF OF WORK</span>
                                <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap max-w-3xl">
                                    {milestoneOffChain.description}
                                </div>
                            </div>
                        )}

                        {milestoneOffChain?.link && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-1">EXTERNAL LINK</span>
                                    <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 line-clamp-1">{milestoneOffChain.link}</span>
                                </div>
                                <a 
                                    href={milestoneOffChain.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono tracking-widest uppercase hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
                                >
                                    OPEN LINK
                                </a>
                            </div>
                        )}

                        {/* On-Chain Details */}
                        {isActive && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 lg:p-10">
                                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-6">ON-CHAIN STATE</span>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Milestone Type</span>
                                        <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{MILESTONE_TYPES[index]}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Status</span>
                                        <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{status}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Attempt</span>
                                        <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{onChainMs.attemptNumber} / 3</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Voting Deadline</span>
                                        <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">
                                            {new Date(Number(onChainMs.votingEndTime) * 1000).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Capital Casted</span>
                                        <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{Number(onChainMs.capitalCasted)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Total Votes</span>
                                        <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{onChainMs.votesCasted}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!isActive && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-12 text-center text-sm font-mono text-zinc-500">
                                This milestone has not been submitted by the creator yet.
                            </div>
                        )}

                        {/* Network Details */}
                        <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 p-6 flex flex-col gap-5">
                            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block">NETWORK DETAILS</span>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Project PDA</span>
                                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm font-mono text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                    <span>{id.slice(0, 8)}...{id.slice(-8)}</span>
                                    <CopyButton text={id} />
                                </div>
                            </div>

                            {milestonePdaKey && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Milestone PDA</span>
                                    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm font-mono text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                        <span>{milestonePdaKey.slice(0, 8)}...{milestonePdaKey.slice(-8)}</span>
                                        <CopyButton text={milestonePdaKey} />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Authority</span>
                                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-sm font-mono text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                    <span>{authorityKey.slice(0, 8)}...{authorityKey.slice(-8)}</span>
                                    <CopyButton text={authorityKey} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Voting / Actions) */}
                    <div className="w-full lg:w-[350px] flex flex-col gap-6 shrink-0">
                        {isActive && (
                            <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 p-6">
                                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-6">VOTING METRICS</span>
                                
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-mono text-zinc-500">Total Votes Cast</span>
                                        <span className="text-sm font-mono font-bold">{onChainMs.votesCasted}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-mono text-zinc-500">Weight FOR</span>
                                        <span className="text-sm font-mono font-bold text-green-500">{Number(onChainMs.voteForWeight)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono text-zinc-500">Weight AGAINST</span>
                                        <span className="text-sm font-mono font-bold text-red-500">{Number(onChainMs.voteAgainstWeight)}</span>
                                    </div>
                                </div>

                                {/* Vote Action */}
                                {isVoting && connected && hasContribution && !isCreator && (
                                    <div className="pt-6 border-t-2 border-dashed border-zinc-300 dark:border-zinc-800">
                                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-4">YOUR ACTION REQUIRED</span>
                                        
                                        {userVoted ? (
                                            <div className="w-full py-4 text-center border border-zinc-700 bg-zinc-900/50 text-zinc-500 text-xs font-mono uppercase tracking-widest">
                                                VOTE CAST
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleVote(true)}
                                                    disabled={voteOnMilestone.isPending}
                                                    className="flex-1 py-4 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors"
                                                >
                                                    {voteOnMilestone.isPending ? '...' : 'VOTE FOR'}
                                                </button>
                                                <button
                                                    onClick={() => handleVote(false)}
                                                    disabled={voteOnMilestone.isPending}
                                                    className="flex-1 py-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors"
                                                >
                                                    {voteOnMilestone.isPending ? '...' : 'AGAINST'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isVoting && connected && !hasContribution && !isCreator && (
                                    <div className="mt-4 p-4 border border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-xs font-mono text-zinc-500 text-center">
                                        Only project funders can cast a vote.
                                    </div>
                                )}
                                
                                {isVoting && isCreator && (
                                    <div className="mt-4 p-4 border border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-xs font-mono text-zinc-500 text-center">
                                        Creators cannot vote on their own milestones.
                                    </div>
                                )}

                                {/* Retry Action */}
                                {isDisapproved && isCreator && onChainMs.attemptNumber < 3 && (
                                    <div className="pt-6 border-t-2 border-dashed border-zinc-300 dark:border-zinc-800">
                                        <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-4">RETRY MILESTONE</span>
                                        <p className="text-[10px] font-mono text-zinc-500 mb-4 leading-relaxed">
                                            This milestone was disapproved. You can re-submit it for another round of voting.
                                        </p>
                                        <button
                                            onClick={handleRetry}
                                            disabled={retryMilestone.isPending}
                                            className="w-full py-4 border border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c] hover:text-white text-xs font-mono tracking-widest uppercase transition-colors"
                                        >
                                            {retryMilestone.isPending ? 'RETRYING...' : 'REATTEMPT MILESTONE'}
                                        </button>
                                    </div>
                                )}
                                
                                {isDisapproved && isCreator && onChainMs.attemptNumber >= 3 && (
                                    <div className="mt-4 p-4 border border-red-500/50 bg-red-500/10 text-xs font-mono text-red-500 text-center">
                                        Max attempts reached. The project has failed.
                                    </div>
                                )}

                                {/* Approved state */}
                                {isApproved && (
                                    <div className="mt-4 p-4 border border-green-500/50 bg-green-500/10 text-xs font-mono text-green-500 text-center">
                                        This milestone has been approved by the community.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-20">
                <Footer />
            </div>
        </main>
    );
}
