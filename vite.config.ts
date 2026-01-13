
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite substitui process.env.API_KEY pelo valor real durante o build.
    // Certifique-se de que a variável API_KEY está definida nas configurações da Vercel.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    target: 'esnext'
  }
});
