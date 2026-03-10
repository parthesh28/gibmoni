'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'; // Added WalletError
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { LogOut, Terminal, X, ChevronRight } from 'lucide-react';
import Image from 'next/image';

// ==========================================
// 1. THE GLOBAL PROVIDER
// ==========================================
export function SolanaProvider({ children }: { children: React.ReactNode }) {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        [network]
    );

    // This intercepts the noisy Phantom errors and stops Next.js from crashing
    const onError = useCallback((error: WalletError) => {
        console.warn('Wallet Adapter Warning:', error.message);
    }, []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            {/* Added the onError handler here */}
            <WalletProvider wallets={wallets} onError={onError} autoConnect>
                {children}
            </WalletProvider>
        </ConnectionProvider>
    );
}

// ... Keep the TerminalWalletModal and WalletButton exactly the same as before ...

// ==========================================
// 2. THE TERMINAL MODAL UI
// ==========================================
function TerminalWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { wallets, select } = useWallet();

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="w-full max-w-sm bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-800 shadow-[8px_8px_0_0_#d4d4d8] dark:shadow-[8px_8px_0_0_#27272a] relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                            SELECT_NODE
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-[#ea580c] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Wallet List */}
                <div className="p-6 flex flex-col gap-3">
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2 uppercase">
                        Available providers detected:
                    </p>

                    {wallets.map((wallet) => (
                        <button
                            key={wallet.adapter.name}
                            onClick={() => {
                                select(wallet.adapter.name);
                                onClose();
                            }}
                            className="group flex items-center justify-between p-3 border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-[#ea580c] hover:border-[#ea580c] dark:hover:bg-[#ea580c] dark:hover:border-[#ea580c] transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 relative bg-white rounded-sm p-0.5">
                                    <Image
                                        src={wallet.adapter.icon}
                                        alt={wallet.adapter.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="font-mono text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100 group-hover:text-white transition-colors">
                                    {wallet.adapter.name}
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-all group-hover:translate-x-1" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 3. THE CUSTOM WALLET BUTTON
// ==========================================
export function WalletButton() {
    const { publicKey, disconnect, connecting } = useWallet();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // STATE 1: NOT CONNECTED
    if (!publicKey) {
        return (
            <>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={connecting}
                    className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-[#ea580c] dark:hover:bg-[#ea580c] hover:text-white dark:hover:text-white px-6 py-2.5 text-xs font-mono tracking-widest uppercase font-bold transition-all duration-200 border border-transparent disabled:opacity-50"
                >
                    {connecting ? '[ CONNECTING... ]' : '[ CONNECT_NODE ]'}
                </button>

                <TerminalWalletModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </>
        );
    }

    // STATE 2: CONNECTED
    const base58 = publicKey.toBase58();
    const truncated = `${base58.slice(0, 4)}...${base58.slice(-4)}`;

    return (
        <div className="flex items-center gap-0">
            <div className="flex items-center gap-2 px-3 py-2 border border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900/50 h-10">
                <div className="w-2 h-2 bg-[#ea580c] animate-pulse"></div>
                <span className="text-xs font-mono tracking-widest text-zinc-900 dark:text-zinc-100">
                    {truncated}
                </span>
            </div>
            <button
                onClick={disconnect}
                className="flex items-center justify-center h-10 w-10 border-y border-r border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-zinc-500 hover:text-[#ea580c] hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors"
                title="Disconnect"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
}