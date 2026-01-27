import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => ({
    base: './',
    server: {
        host: "::",
        port: 5174,
    },
    plugins: [
        react(),
        mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: 'dist-notes',
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'index.notes.html'),
            },
        },
    },
}));
