
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Injeta a variável de ambiente diretamente. 
    // Se estiver rodando localmente, certifique-se de ter um arquivo .env com API_KEY=...
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  }
});
