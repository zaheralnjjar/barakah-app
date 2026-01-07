import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewMuslimsApp from './NewMuslimsApp';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
            <NewMuslimsApp />
        </ErrorBoundary>
    </QueryClientProvider>
);
