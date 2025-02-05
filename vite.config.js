import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/walletconnect': {
        target: 'https://verify.walletconnect.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/walletconnect/, ''),
      },
    },
  },
});
