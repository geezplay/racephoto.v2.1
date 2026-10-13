import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: './tests/setup.ts',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DB_NAME: process.env.DB_NAME_TEST || 'racephoto_test',
    },
  },
});
