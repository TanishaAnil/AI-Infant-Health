import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the browser. 
      // It prioritizes the .env file variable, then falls back to the system environment variable.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    server: {
      port: 5173,
      host: true
    }
  };
});
