import Link from 'next/link';
import { WalletButton } from "../app/context/solanaProvider"
import { ThemeSelect } from './themeSelect';

export default function Navbar() {
    return (
        <div className="absolute top-0 left-0 right-0 w-full px-4 pt-4 lg:px-6 lg:pt-6 z-50">
            <div className="relative w-full ">

                <nav className="relative w-full border border-orange-500/20 dark:border-orange-100/30 bg-zinc-100 dark:bg-neutral-950 px-6 py-3 lg:px-8 transition-colors duration-300">

                    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-orange-300 dark:border-orange-200 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-orange-300 dark:border-orange-200 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-orange-300 dark:border-orange-200 pointer-events-none transition-colors duration-300"></div>
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-orange-300 dark:border-orange-200 pointer-events-none transition-colors duration-300"></div>

                    <div className="flex items-center justify-between">

                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-mono text-xs group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors duration-300">
                                {`[$]`}
                            </span>
                            <span className="text-sm sm:text-base tracking-[0.15em] text-orange-600/80 dark:text-orange-100 font-pixel transition-colors duration-300">
                                GIBMONI
                            </span>
                        </Link>

                        <div className="flex items-center gap-6">
                                <ThemeSelect/>
                        </div>

                    </div>
                </nav>
            </div>
        </div>
    )
}