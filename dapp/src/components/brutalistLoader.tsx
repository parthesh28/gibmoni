import React from 'react';

interface BrutalistLoaderProps {
    text?: string;
}

export function BrutalistLoader({ text = "LOADING.SYS // AWAIT" }: BrutalistLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="flex gap-1.5 mb-6">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="w-3 h-8 bg-[#ea580c] animate-pulse"
                        style={{
                            animationDelay: `${i * 150}ms`,
                            animationDuration: '1.2s'
                        }}
                    />
                ))}
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400">
                {text}
            </span>
        </div>
    );
}
