import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/services/thesis/LoggerService';
import { AlertTriangle, RefreshCcw, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error in component tree', { error: error.message, stack: errorInfo.componentStack });
    }

    public handleReload = () => {
        window.location.reload();
    };

    public handleCopyError = () => {
        if (this.state.error) {
            navigator.clipboard.writeText(this.state.error.toString());
            toast.success("تم نسخ تفاصيل الخطأ");
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4" dir="rtl">
                    <div className="p-4 bg-red-50 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">عذراً، حدث خطأ غير متوقع</h2>
                    <p className="text-gray-600 max-w-md">
                        واجه التطبيق مشكلة في عرض هذه الصفحة. تم تسجيل الخطأ للتحليل.
                    </p>

                    {this.state.error && (
                        <div className="w-full max-w-lg p-4 mt-4 bg-gray-100 rounded text-left overflow-auto text-xs font-mono border border-gray-200">
                            {this.state.error.toString()}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button onClick={this.handleReload} className="gap-2">
                            <RefreshCcw className="w-4 h-4" />
                            إعادة تحميل الصفحة
                        </Button>
                        <Button variant="outline" onClick={this.handleCopyError} className="gap-2">
                            <Copy className="w-4 h-4" />
                            نسخ الخطأ
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
