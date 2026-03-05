'use client'

import { ThemeProvider } from './themeProvider'
import { ClusterProvider } from './clusterProvider'
import { SolanaProvider } from './solanaProvider'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {

    const client = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    });

    return (
        <QueryClientProvider client={client}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <ClusterProvider>
                    <SolanaProvider>{children}</SolanaProvider>
                </ClusterProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}