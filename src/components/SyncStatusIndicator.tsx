import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SyncStatusIndicatorProps {
    isOnline: boolean;
    isSyncing: boolean;
    lastSync: Date | null;
    pendingActions: number;
    failedActions: number;
    onSyncClick?: () => void;
    compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
    isOnline,
    isSyncing,
    lastSync,
    pendingActions,
    failedActions,
    onSyncClick,
    compact = false,
}) => {
    // Determine status
    const getStatus = () => {
        if (!isOnline) return 'offline';
        if (isSyncing) return 'syncing';
        if (failedActions > 0) return 'error';
        if (pendingActions > 0) return 'pending';
        return 'synced';
    };

    const status = getStatus();

    // Format last sync time
    const formatLastSync = (date: Date | null): string => {
        if (!date) return 'لم تتم المزامنة بعد';

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return date.toLocaleDateString('ar-SA');
    };

    // Status configurations
    const statusConfig: Record<string, {
        icon: typeof Cloud;
        color: string;
        bgColor: string;
        label: string;
        description: string;
        animate?: boolean;
    }> = {
        offline: {
            icon: CloudOff,
            color: 'text-gray-500',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            label: 'غير متصل',
            description: 'سيتم المزامنة عند عودة الاتصال',
        },
        syncing: {
            icon: RefreshCw,
            color: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900',
            label: 'جاري المزامنة...',
            description: 'يتم مزامنة البيانات',
            animate: true,
        },
        error: {
            icon: AlertTriangle,
            color: 'text-red-500',
            bgColor: 'bg-red-100 dark:bg-red-900',
            label: 'خطأ في المزامنة',
            description: `${failedActions} عملية فاشلة`,
        },
        pending: {
            icon: Clock,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900',
            label: 'عمليات معلقة',
            description: `${pendingActions} عملية في الانتظار`,
        },
        synced: {
            icon: Check,
            color: 'text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900',
            label: 'متزامن',
            description: formatLastSync(lastSync),
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onSyncClick}
                            disabled={isSyncing || !isOnline}
                            className={cn(
                                'p-2 rounded-full transition-colors',
                                config.bgColor,
                                'hover:opacity-80 disabled:cursor-not-allowed'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'w-4 h-4',
                                    config.color,
                                    config.animate && 'animate-spin'
                                )}
                            />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <div className="text-center">
                            <p className="font-medium">{config.label}</p>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onSyncClick}
                        disabled={isSyncing || !isOnline}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors',
                            config.bgColor,
                            'hover:opacity-80 disabled:cursor-not-allowed'
                        )}
                    >
                        <Icon
                            className={cn(
                                'w-4 h-4',
                                config.color,
                                config.animate && 'animate-spin'
                            )}
                        />
                        <span className={cn('text-sm font-medium', config.color)}>
                            {config.label}
                        </span>

                        {/* Pending/Failed badge */}
                        {(pendingActions > 0 || failedActions > 0) && (
                            <Badge
                                variant={failedActions > 0 ? 'destructive' : 'secondary'}
                                className="text-xs px-1.5 py-0"
                            >
                                {failedActions > 0 ? failedActions : pendingActions}
                            </Badge>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {isOnline ? (
                                <Cloud className="w-4 h-4 text-green-500" />
                            ) : (
                                <CloudOff className="w-4 h-4 text-gray-500" />
                            )}
                            <span>{isOnline ? 'متصل بالإنترنت' : 'غير متصل'}</span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            <p>آخر مزامنة: {formatLastSync(lastSync)}</p>
                            {pendingActions > 0 && (
                                <p>عمليات معلقة: {pendingActions}</p>
                            )}
                            {failedActions > 0 && (
                                <p className="text-red-500">عمليات فاشلة: {failedActions}</p>
                            )}
                        </div>

                        {isOnline && !isSyncing && (
                            <p className="text-xs text-primary">اضغط للمزامنة الآن</p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default SyncStatusIndicator;
