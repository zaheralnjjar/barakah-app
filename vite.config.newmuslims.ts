// vite.config.newmuslims.ts - Separate Vite config for New Muslims standalone app
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist-newmuslims',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.newmuslims.html')
            }
        }
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
