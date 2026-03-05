import React from 'react'
import { Github, ExternalLink, Twitter, Coffee } from 'lucide-react'

export function Footer() {
    return (
        <footer className="mt-auto border-t border-zinc-200/60 dark:border-zinc-800/60 bg-gradient-to-r from-zinc-50/80 via-zinc-50/50 to-zinc-50/80 dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-zinc-900/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                            Made in <span className="text-zinc-800 dark:text-zinc-200 font-medium">T_T</span> with
                        </span>
                        <a
                            href="https://github.com/solana-developers/create-solana-dapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 group border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                            <span className="font-medium">create-solana-dapp</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                        </a>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-500 animate-ping opacity-75"></div>
                            </div>
                            <span className="text-yellow-700 dark:text-yellow-400 font-medium">Solana Devnet</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-blue-700 dark:text-blue-400 font-medium">Spliter v1.0</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/parthesh28/spliter-frontend"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                aria-label="View Source Code"
                                title="View Source Code"
                            >
                                <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            </a>
                            <a
                                href="https://twitter.com/parthesh28"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                aria-label="Twitter Profile"
                                title="Twitter Profile"
                            >
                                <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            </a>
                            <a
                                href="https://buymeacoffee.com/parthesh28"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                                aria-label="Buy me a coffee"
                                title="Buy me a coffee"
                            >
                                <Coffee className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-200" />
                            </a>
                        </div>

                        <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700"></div>

                        <a
                            href="https://github.com/parthesh28"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium transition-colors duration-200"
                        >
                            © {new Date().getFullYear()} Parthesh28
                        </a>
                    </div>
                </div>

                <div className="mt-6 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent opacity-50"></div>
            </div>
        </footer>
    )
}

export default Footer