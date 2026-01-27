import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import NotesOnlyView from "./components/notes-app/NotesOnlyView";
import './index.css';
import './i18n/config';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
                        <NotesOnlyView />
                        <Toaster />
                        <Sonner />
                    </Suspense>
                </TooltipProvider>
            </QueryClientProvider>
        </HashRouter>
    </React.StrictMode>
);
