import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import NewMuslimsApp from './NewMuslimsApp';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import '@fontsource/amiri';

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
        <BrowserRouter>
            <ErrorBoundary>
                <NewMuslimsApp />
            </ErrorBoundary>
        </BrowserRouter>
    </QueryClientProvider>
);

