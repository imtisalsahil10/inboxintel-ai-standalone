import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TypeScript error if @types/node is missing
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the Gemini Service
      'process.env.BASE_URL': JSON.stringify(env.BASE_URL),
    },
    server: {
      port: 5173,
      proxy: {
        // Proxy API requests to backend during development if needed, 
        // though the current app uses absolute URLs (localhost:3000) in constants.
      }
    }
  };
});