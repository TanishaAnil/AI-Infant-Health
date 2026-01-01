
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Use logical OR to prioritize loaded env, but allow fallback to existing process.env if present at runtime
      'process.env.API_KEY': env.API_KEY ? JSON.stringify(env.API_KEY) : 'process.env.API_KEY'
    },
    server: {
        host: true,
        port: 3000
    }
  };
});
