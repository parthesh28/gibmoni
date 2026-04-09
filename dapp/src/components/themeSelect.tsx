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
        <div className="relative">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="relative h-10 w-10 rounded-none border border-border/80 bg-background text-zinc-500 transition-colors hover:border-[#ea580c] hover:bg-[#ea580c]/10 hover:text-[#ea580c] focus-visible:ring-0 focus-visible:ring-offset-0 group"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-180 dark:scale-0 text-[#ea580c] group-hover:text-[#c2410c]" />
                        <Moon className="absolute h-4 w-4 rotate-180 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 text-[#ea580c] group-hover:text-[#c2410c]" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="min-w-[160px] rounded-none border border-border/80 bg-background p-1 shadow-xl backdrop-blur-xl"
                >
                    <DropdownMenuItem
                        onClick={() => setTheme('light')}
                        className="flex cursor-pointer items-center justify-between rounded-none px-3 py-2 transition-colors duration-200 hover:bg-muted focus:bg-muted group"
                    >
                        <div className="flex items-center">
                            <Sun className="mr-3 h-3.5 w-3.5 text-[#ea580c]/70 transition-colors group-hover:text-[#ea580c]" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Light</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#ea580c]">
                            {theme === 'light' ? '[✓]' : ''}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setTheme('dark')}
                        className="flex cursor-pointer items-center justify-between rounded-none px-3 py-2 transition-colors duration-200 hover:bg-muted focus:bg-muted group"
                    >
                        <div className="flex items-center">
                            <Moon className="mr-3 h-3.5 w-3.5 text-[#ea580c]/70 transition-colors group-hover:text-[#ea580c]" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Dark</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#ea580c]">
                            {theme === 'dark' ? '[✓]' : ''}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setTheme('system')}
                        className="flex cursor-pointer items-center justify-between rounded-none px-3 py-2 transition-colors duration-200 hover:bg-muted focus:bg-muted group"
                    >
                        <div className="flex items-center">
                            <Monitor className="mr-3 h-3.5 w-3.5 text-[#ea580c]/70 transition-colors group-hover:text-[#ea580c]" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">System</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#ea580c]">
                            {theme === 'system' ? '[✓]' : ''}
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}