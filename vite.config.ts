
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que o código 'process.env.API_KEY' seja substituído pelo valor da variável de ambiente no momento do build.
    // Na Vercel, você deve configurar uma Environment Variable com o nome exato: API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  }
});
