
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Robustly polyfill process.env.API_KEY for the browser.
      // This ensures that when the Gemini SDK looks for process.env.API_KEY, 
      // it finds the value provided in the environment.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || "")
    },
    server: {
        host: true,
        port: 3000
    }
  };
});
