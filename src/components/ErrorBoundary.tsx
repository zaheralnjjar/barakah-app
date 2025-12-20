import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <AlertTriangle className="w-16 h-16 text-red-500" />
                            </div>
                            <CardTitle className="text-2xl text-red-600">
                                حدث خطأ غير متوقع
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm font-mono text-red-800 dir-ltr">
                                    {this.state.error?.message || 'خطأ غير معروف'}
                                </p>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                <details className="bg-gray-100 border rounded-lg p-4">
                                    <summary className="cursor-pointer font-semibold text-sm mb-2">
                                        تفاصيل تقنية (للمطورين)
                                    </summary>
                                    <pre className="text-xs overflow-auto dir-ltr">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-3 justify-center pt-4">
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    إعادة المحاولة
                                </Button>
                                <Button
                                    onClick={this.handleGoHome}
                                    className="gap-2"
                                >
                                    <Home className="w-4 h-4" />
                                    العودة للرئيسية
                                </Button>
                            </div>

                            <p className="text-center text-sm text-gray-500 pt-4">
                                إذا استمرت المشكلة، يرجى تحديث الصفحة أو مسح بيانات المتصفح
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
