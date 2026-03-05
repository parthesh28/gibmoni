'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeSelect() {
    const { setTheme, theme } = useTheme()

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="relative overflow-hidden w-12 h-12 rounded-xl border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-zinc-900/90 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                        style={{
                            marginBottom: 'max(1.5rem, env(keyboard-inset-height, 0px))',
                        }}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-180 dark:scale-0 text-amber-500" />
                        <Moon className="absolute h-4 w-4 rotate-180 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 text-blue-400" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="min-w-[140px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-zinc-200/60 dark:border-zinc-800/60 shadow-lg"
                >
                    <DropdownMenuItem
                        onClick={() => setTheme('light')}
                        className="cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 focus:bg-zinc-100/80 dark:focus:bg-zinc-800/80 transition-colors duration-200"
                    >
                        <Sun className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="font-medium">Light</span>
                        {theme === 'light' && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-amber-500"></div>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setTheme('dark')}
                        className="cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 focus:bg-zinc-100/80 dark:focus:bg-zinc-800/80 transition-colors duration-200"
                    >
                        <Moon className="mr-2 h-4 w-4 text-blue-400" />
                        <span className="font-medium">Dark</span>
                        {theme === 'dark' && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setTheme('system')}
                        className="cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 focus:bg-zinc-100/80 dark:focus:bg-zinc-800/80 transition-colors duration-200"
                    >
                        <Monitor className="mr-2 h-4 w-4 text-zinc-500" />
                        <span className="font-medium">System</span>
                        {theme === 'system' && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-zinc-500"></div>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}