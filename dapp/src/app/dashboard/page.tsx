'use client'

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Terminal, Loader2, Box, Users, Zap, Search, Filter, X } from 'lucide-react';
import { useGibmoniProgram } from '../hooks/useAnchorQueries';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import FloatingNav from '@/components/floatingNav';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

type ApiProject = {
    id: string;
    creatorWallet: string;
    title: string;
    tagline: string;
    description: string;
    category: string | null;
    coverImageUrl: string | null;
    createdAt: string;
    creatorAlias: string | null;
};

type OnChainProject = {
    publicKey: PublicKey;
    account: {
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
};

type MergedProject = {
    id: string;
    title: string;
    tagline: string;
    category: string | null;
    creatorAlias: string | null;
    state: string;
    targetAmount: number;
    collectedAmount: number;
    funderCount: number;
    progress: number;
    hasApiData: boolean;
};

function getProjectState(state: any): string {
    if (state?.funding !== undefined) return 'Funding';
    if (state?.development !== undefined) return 'Development';
    if (state?.completed !== undefined) return 'Completed';
    if (state?.failed !== undefined) return 'Failed';
    return 'Unknown';
}

function getStateBadgeClasses(state: string): string {
    switch (state) {
        case 'Funding': return 'border-[#ea580c] text-[#ea580c] animate-pulse';
        case 'Development': return 'border-yellow-500 text-yellow-500';
        case 'Completed': return 'border-green-500 text-green-500';
        case 'Failed': return 'border-red-500 text-red-500';
        default: return 'border-zinc-500 text-zinc-500';
    }
}

export default function DashboardPage() {
    const { getAllProjects } = useGibmoniProgram();
    const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'FUNDING'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch off-chain project data from API
    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch(`${API_URL}/api/projects`);
                if (res.ok) {
                    const data = await res.json();
                    setApiProjects(data);
                }
            } catch (err) {
                console.error('Failed to fetch API projects:', err);
            }
        }
        fetchProjects();
    }, []);

    const onChainProjects: OnChainProject[] = getAllProjects.data ?? [];
    const loading = getAllProjects.isLoading;

    // ON-CHAIN FIRST: iterate over on-chain projects, enrich with optional API data
    const mergedProjects: MergedProject[] = onChainProjects.map(ocp => {
        const apiMatch = apiProjects.find(ap => ap.id === ocp.publicKey.toBase58());

        const state = getProjectState(ocp.account.projectState);
        const targetAmount = Number(ocp.account.targetAmount) / LAMPORTS_PER_SOL;
        const collectedAmount = Number(ocp.account.collectedAmount) / LAMPORTS_PER_SOL;
        const progress = targetAmount > 0 ? Math.min((collectedAmount / targetAmount) * 100, 100) : 0;

        return {
            id: ocp.publicKey.toBase58(),
            title: apiMatch?.title || ocp.account.projectName,
            tagline: apiMatch?.tagline || `Target: ${targetAmount.toFixed(2)} SOL`,
            category: apiMatch?.category || null,
            creatorAlias: apiMatch?.creatorAlias || ocp.account.projectAuthority.toBase58().slice(0, 6) + '...',
            state,
            targetAmount,
            collectedAmount,
            funderCount: ocp.account.funderCount,
            progress,
            hasApiData: !!apiMatch,
        };
    });

    const filteredProjects = useMemo(() => {
        let result = mergedProjects;
        
        if (filter === 'FUNDING') {
            result = result.filter(p => p.state === 'Funding');
        }
        
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title.toLowerCase().includes(q) || 
                (p.creatorAlias && p.creatorAlias.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
        }
        
        return result;
    }, [mergedProjects, filter, searchQuery]);

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 px-6 lg:px-12 py-12 pb-28">
            <FloatingNav />

            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Terminal className="w-5 h-5 text-[#ea580c]" />
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
                            EXPLORE // ALL_NODES
                        </span>
                    </div>
                    <h1 className="font-pixel text-4xl lg:text-5xl text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
                        Explore Projects
                    </h1>
                    <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                        Browse active campaigns on the GIBMONI protocol. All data pulled directly from the Solana ledger, enriched with off-chain metadata when available.
                    </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex gap-0">
                        <button
                            onClick={() => setFilter('ALL')}
                        className={`px-5 py-2.5 text-[10px] font-mono tracking-widest uppercase border border-zinc-300 dark:border-zinc-700 transition-all duration-200 ${
                            filter === 'ALL'
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                                : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-[#ea580c]'
                        }`}
                    >
                        All ({mergedProjects.length})
                    </button>
                    <button
                        onClick={() => setFilter('FUNDING')}
                        className={`px-5 py-2.5 text-[10px] font-mono tracking-widest uppercase border border-l-0 border-zinc-300 dark:border-zinc-700 transition-all duration-200 ${
                            filter === 'FUNDING'
                                ? 'bg-[#ea580c] text-white border-[#ea580c]'
                                : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-[#ea580c]'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Funding ({mergedProjects.filter(p => p.state === 'Funding').length})
                        </span>
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search projects, builders, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#ea580c] transition-colors"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin mb-4" />
                        <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                            LOADING ON-CHAIN NODES...
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredProjects.length === 0 && (
                    <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 p-20 flex flex-col items-center justify-center">
                        <Box className="w-14 h-14 text-zinc-300 dark:text-zinc-700 mb-6" />
                        <h3 className="font-pixel text-xl text-zinc-600 dark:text-zinc-400 uppercase mb-3">
                            No Projects Found
                        </h3>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mb-8 text-center max-w-md">
                            {searchQuery ? `No projects match your search "${searchQuery}".` : 
                             filter === 'FUNDING' ? 'No projects are currently seeking funding.' : 
                             'The protocol has no registered projects yet. Be the first.'}
                        </p>
                        {!searchQuery && (
                            <Link
                                href="/create"
                                className="bg-[#ea580c] text-white px-8 py-4 text-xs font-mono tracking-widest uppercase hover:bg-[#c2410c] transition-colors duration-200"
                            >
                                [ INIT_PROJECT ]
                            </Link>
                        )}
                    </div>
                )}

                {/* Project Grid */}
                {!loading && filteredProjects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                className="border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200 group flex flex-col"
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800/50">
                                    <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 dark:text-zinc-500 truncate max-w-[140px]">
                                        {project.id.slice(0, 6)}...{project.id.slice(-4)}
                                    </span>
                                    <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 border ${getStateBadgeClasses(project.state)}`}>
                                        {project.state}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Category */}
                                    {project.category && (
                                        <span className="text-[9px] font-mono tracking-widest uppercase text-[#ea580c] mb-3 block">
                                            {project.category}
                                        </span>
                                    )}

                                    <h3 className="font-pixel text-lg text-zinc-900 dark:text-zinc-100 uppercase mb-2 leading-tight">
                                        {project.title}
                                    </h3>
                                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-6 line-clamp-2 leading-relaxed flex-1">
                                        {project.tagline}
                                    </p>

                                    {/* Vault Progress */}
                                    <div className="mb-5">
                                        <div className="flex justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2">
                                            <span>{project.collectedAmount.toFixed(2)} SOL</span>
                                            <span>{project.targetAmount.toFixed(2)} SOL</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800">
                                            <div
                                                className="h-full bg-[#ea580c] transition-all duration-500"
                                                style={{ width: `${project.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Footer Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                                                by <span className="text-zinc-700 dark:text-zinc-300">{project.creatorAlias}</span>
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                                <Users className="w-3 h-3" />
                                                {project.funderCount}
                                            </span>
                                        </div>
                                        {!project.hasApiData && (
                                            <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-600 border border-zinc-300 dark:border-zinc-800 px-1.5 py-0.5">ON-CHAIN</span>
                                        )}
                                    </div>
                                </div>

                                {/* View Button */}
                                <Link
                                    href={`/project/${project.id}`}
                                    className="block w-full px-5 py-4 text-center text-[10px] font-mono tracking-widest uppercase border-t border-zinc-200 dark:border-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-[#ea580c] hover:text-white hover:border-[#ea580c] transition-all duration-200"
                                >
                                    [ VIEW_NODE ]
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
