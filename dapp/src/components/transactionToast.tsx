import { toast } from 'sonner'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useCluster } from '@/app/context/clusterProvider';

const ExplorerLink = ({ path, label, className }: { path: string; label: string; className?: string }) => {
    const { getExplorerUrl } = useCluster()
    return (
        <a
            href={getExplorerUrl(path)}
            target="_blank"
            rel="noopener noreferrer"
            className={className ? className : `link font-mono`}
        >
            {label}
        </a>
    )
}

export function useTransactionToast() {
    return (signature: string, options?: { title?: string; description?: string }) => {
        toast.success(options?.title || 'Transaction Successful', {
            description: (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {options?.description || 'Your transaction has been confirmed on the blockchain'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                        <ExplorerLink
                            path={`tx/${signature}`}
                            label="View on Explorer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        />
                    </div>
                </div>
            ),
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
            duration: 5000,
            className: 'bg-white dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700/60 backdrop-blur-xl shadow-xl',
            style: {
                borderRadius: '12px',
            },
        })
    }
}

export function useAdvancedTransactionToast() {
    const showSuccess = (signature: string, options?: { title?: string; description?: string }) => {
        toast.success(options?.title || 'Transaction Successful', {
            description: (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {options?.description || 'Your transaction has been confirmed on the blockchain'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                        <ExplorerLink
                            path={`tx/${signature}`}
                            label="View Transaction"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors" />
                        <ExternalLink className="w-3 h-3" />
                    </div>
                </div>
            ),
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
            duration: 6000,
            className: 'bg-white dark:bg-zinc-900/95 border border-emerald-200 dark:border-emerald-800/40 backdrop-blur-xl shadow-xl',
            style: {
                borderRadius: '12px',
            },
        })
    }

    const showPending = (message?: string) => {
        toast.loading(message || 'Transaction Processing', {
            description: 'Please wait while your transaction is being confirmed...',
            className: 'bg-white dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700/60 backdrop-blur-xl shadow-xl',
            style: {
                borderRadius: '12px',
            },
        })
    }

    const showError = (error: string) => {
        toast.error('Transaction Failed', {
            description: error || 'Something went wrong with your transaction',
            duration: 8000,
            className: 'bg-white dark:bg-zinc-900/95 border border-red-200 dark:border-red-800/40 backdrop-blur-xl shadow-xl',
            style: {
                borderRadius: '12px',
            },
        })
    }

    return {
        success: showSuccess,
        pending: showPending,
        error: showError,
    }
}