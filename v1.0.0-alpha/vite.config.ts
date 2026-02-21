import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const serverPort = process.env.SERVER_PORT || '3000';

export default defineConfig({
  plugins: [
    react()
  ],
  root: './src/client',
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    outDir: '../../public/assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        client: resolve(__dirname, 'src/client/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/socket.io': {
        target: `http://localhost:${serverPort}`,
        ws: true,
      },
      '/api': {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
      },
    },
  },
});
