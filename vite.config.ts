import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: { port: 5454 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
