"use client"

import React, { use, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, X, Crown, User, Users } from "lucide-react"
import FabCreateSplit from "./fab"
import { useGibmoniProgram } from "../app/hooks/useAnchorQueries"
import { PublicKey } from '@solana/web3.js'
import { BN, ProgramAccount } from '@coral-xyz/anchor'

type ActualContributor = {
    contributor: PublicKey
    percent: number
    hasCleared: boolean
    clearedAt: BN
}

type ActualSplitAccount = {
    splitAuthority: PublicKey
    splitName: string
    receiver: PublicKey
    splitAmount: BN
    contributors: ActualContributor[]
    receivedAmount: BN
    isReleased: boolean
    releasedAt: BN
    bump: number
}

type SplitProgramAccount = ProgramAccount<ActualSplitAccount>

type RoleFilter = "All" | "Creator" | "Contributor" | "Both"

const bnToNumber = (bn: BN): number => {
    try {
        return bn.toNumber()
    } catch (error) {
        console.warn('BN too large for toNumber(), using toString and parsing', error)
        const str = bn.toString()
        return parseInt(str, 10)
    }
}

const publicKeyToString = (pk: PublicKey): string => {
    return pk.toString()
}

const transformSplit = (programAccount: SplitProgramAccount) => {
    const { account, publicKey } = programAccount

    return {
        id: publicKeyToString(publicKey),
        name: account.splitName || "Unnamed Split",
        split_authority: publicKeyToString(account.splitAuthority),
        receiver: publicKeyToString(account.receiver),
        split_amount: bnToNumber(account.splitAmount),
        received_amount: bnToNumber(account.receivedAmount),
        is_released: account.isReleased,
        released_at: bnToNumber(account.releasedAt),
        contributors: account.contributors.map(c => ({
            contributor: publicKeyToString(c.contributor),
            percent: c.percent,
            has_cleared: c.hasCleared,
            cleared_at: bnToNumber(c.clearedAt)
        }))
    }
}

export default function Home({
    programAccounts,
    userPubkey,
    onViewDetails,
}: {
    programAccounts: SplitProgramAccount[]
    userPubkey: string | PublicKey
    onViewDetails: (splitId: string) => void
}) {
    const [query, setQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("All")
    const { getAllProjects } = useGibmoniProgram()

    const to58 = (v: string | PublicKey): string => {
        if (typeof v === "string") return v
        return v?.toString()
    }
    const me = to58(userPubkey)

    const { data } = getAllProjects
    console.log("Raw data from hook:", data)
    const splits = useMemo(() => {
        if (!programAccounts || !Array.isArray(programAccounts)) {
            return []
        }

        return programAccounts
            .map(transformSplit)
            .filter((split) => {
                const isCreator = split.split_authority === me
                const isContributor = split.contributors?.some(c => c.contributor === me)
                return isCreator || isContributor
            })
    }, [programAccounts, me])

    console.log("Transformed and filtered splits:", splits)

    const filtered = useMemo(() => {
        if (!splits || !Array.isArray(splits)) {
            return []
        }

        const q = query.trim().toLowerCase()

        return splits.filter((s) => {
            const name = (s.name ?? "").toLowerCase()
            if (q && !name.includes(q)) return false

            const isCreator = s.split_authority === me
            const userContrib = s.contributors?.find((c) => c.contributor === me)
            const isContributor = Boolean(userContrib)

            switch (roleFilter) {
                case "Creator":
                    if (!isCreator) return false
                    break
                case "Contributor":
                    if (!isContributor) return false
                    break
                case "Both":
                    if (!(isCreator && isContributor)) return false
                    break
                case "All":
                default:
                    break
            }
            return true
        })
    }, [splits, query, roleFilter, me])


    const activeFiltersCount = [
        roleFilter !== "All" ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0)

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col h-screen">
            <div className="flex-shrink-0">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                        Your Splits
                    </h1>
                </div>

                <div className="mx-auto w-full max-w-4xl flex items-center gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by split name..."
                            className="pl-11 h-12 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-300/60 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 backdrop-blur-xl focus-visible:ring-0 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                        />
                        {query && (
                            <button
                                aria-label="Clear search"
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="relative h-12 w-12 rounded-2xl p-0 grid place-items-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-300/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                                aria-label="Role filter"
                            >
                                <Filter className="h-5 w-5" />
                                {activeFiltersCount > 0 && (
                                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-200 dark:to-zinc-300 text-zinc-100 dark:text-zinc-900 rounded-full text-xs font-medium flex items-center justify-center">
                                        {activeFiltersCount}
                                    </div>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-200 min-w-[170px] shadow-xl"
                        >
                            <DropdownMenuRadioGroup value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                                <DropdownMenuRadioItem value="All" className="cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800">
                                    <Users className="w-4 h-4 mr-2" />
                                    All
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="Creator" className="cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800">
                                    <Crown className="w-4 h-4 mr-2" />
                                    Creator
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="Contributor" className="cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800">
                                    <User className="w-4 h-4 mr-2" />
                                    Contributor
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="Both" className="cursor-pointer rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800">
                                    <Users className="w-4 h-4 mr-2" />
                                    Both
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>


                {(query || activeFiltersCount > 0) && (
                    <div className="mx-auto w-full max-w-4xl mb-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-700/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <span>Showing {filtered.length} split{filtered.length !== 1 ? 's' : ''} matching</span>
                                {query && (
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg">
                                        {query}
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQuery("")
                                    setRoleFilter("All")
                                }}
                                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 h-7 px-3 rounded-lg"
                            >
                                Clear all
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 px-4">
                        {filtered.length > 0 ? (
                            filtered.map((s) => (
                                <div
                                    key={s.id}
                                    className="transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                                >
                                    {/* <SplitCard
                                        split={s}
                                        userPubkey={me}
                                        onViewDetails={onViewDetails}
                                    /> */}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 py-20">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-300/50 dark:border-zinc-700/50 mb-4 shadow-lg">
                                    <Search className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    No splits found
                                </h3>
                                <p className="text-sm text-center max-w-md">
                                    {query || activeFiltersCount > 0
                                        ? "Try adjusting your search or filters to find what you're looking for."
                                        : "You don't have any splits yet where you're involved as creator or contributor. Create one to get started."}
                                </p>
                                {(query || activeFiltersCount > 0) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setQuery("")
                                            setRoleFilter("All")
                                        }}
                                        className="mt-4 text-zinc-600 dark:text-zinc-300 rounded-xl"
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FabCreateSplit />
        </div>
    )
}