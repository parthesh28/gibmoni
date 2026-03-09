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
                    {/* Color-matched Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="relative w-10 h-10 rounded-none border border-orange-500/20 dark:border-orange-100/30 bg-zinc-100 dark:bg-neutral-950 hover:bg-orange-500/10 dark:hover:bg-orange-100/10 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 group"
                    >
                        {/* Orange-tinted Icons */}
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-180 dark:scale-0 text-orange-600/80 dark:text-orange-100 group-hover:text-orange-600 dark:group-hover:text-orange-50" />
                        <Moon className="absolute h-4 w-4 rotate-180 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 text-orange-600/80 dark:text-orange-100 group-hover:text-orange-600 dark:group-hover:text-orange-50" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>

                {/* Color-matched Dropdown Menu */}
                <DropdownMenuContent
                    align="end"
                    className="min-w-[140px] rounded-none border border-orange-500/20 dark:border-orange-100/30 bg-zinc-100 dark:bg-neutral-950 p-1 shadow-none"
                >
                    <DropdownMenuItem
                        onClick={() => setTheme('light')}
                        className="rounded-none cursor-pointer hover:bg-orange-500/10 dark:hover:bg-orange-100/10 focus:bg-orange-500/10 dark:focus:bg-orange-100/10 transition-colors duration-200 flex items-center justify-between px-3 py-2 group"
                    >
                        <div className="flex items-center">
                            <Sun className="mr-3 h-3.5 w-3.5 text-orange-600/60 dark:text-orange-100/60 group-hover:text-orange-600 dark:group-hover:text-orange-100 transition-colors" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Light</span>
                        </div>
                        <span className="font-mono text-[10px] text-orange-600 dark:text-orange-200">
                            {theme === 'light' ? '[✓]' : ''}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setTheme('dark')}
                        className="rounded-none cursor-pointer hover:bg-orange-500/10 dark:hover:bg-orange-100/10 focus:bg-orange-500/10 dark:focus:bg-orange-100/10 transition-colors duration-200 flex items-center justify-between px-3 py-2 group"
                    >
                        <div className="flex items-center">
                            <Moon className="mr-3 h-3.5 w-3.5 text-orange-600/60 dark:text-orange-100/60 group-hover:text-orange-600 dark:group-hover:text-orange-100 transition-colors" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Dark</span>
                        </div>
                        <span className="font-mono text-[10px] text-orange-600 dark:text-orange-200">
                            {theme === 'dark' ? '[✓]' : ''}
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setTheme('system')}
                        className="rounded-none cursor-pointer hover:bg-orange-500/10 dark:hover:bg-orange-100/10 focus:bg-orange-500/10 dark:focus:bg-orange-100/10 transition-colors duration-200 flex items-center justify-between px-3 py-2 group"
                    >
                        <div className="flex items-center">
                            <Monitor className="mr-3 h-3.5 w-3.5 text-orange-600/60 dark:text-orange-100/60 group-hover:text-orange-600 dark:group-hover:text-orange-100 transition-colors" />
                            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">System</span>
                        </div>
                        <span className="font-mono text-[10px] text-orange-600 dark:text-orange-200">
                            {theme === 'system' ? '[✓]' : ''}
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}