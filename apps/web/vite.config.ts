import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@rms/contracts/public': path.resolve(__dirname, '../../libs/contracts/public/index.ts'),
    },
  },
  server: { port: 5173, strictPort: true },
});
