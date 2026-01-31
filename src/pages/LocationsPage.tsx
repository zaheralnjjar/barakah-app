import React from 'react';
import InteractiveMap from '@/components/InteractiveMap';

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 text-red-900 border border-red-200 m-4 rounded">
                    <h2 className="font-bold mb-2">Something went wrong in the Map Component:</h2>
                    <pre className="text-xs overflow-auto bg-white p-2 border rounded">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const LocationsPage = () => {
    return (
        <ErrorBoundary>
            <InteractiveMap />
        </ErrorBoundary>

    );
};

export default LocationsPage;
