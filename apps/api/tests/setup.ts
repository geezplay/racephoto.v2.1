import { execSync } from 'child_process';
import path from 'path';

// Runs before the test suite: ensures the test database schema is up to date.
export default function setup(): void {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    DB_NAME: process.env.DB_NAME_TEST || 'racephoto_test',
  };
  execSync('npx sequelize-cli db:migrate', {
    cwd: path.resolve(__dirname, '..'),
    env,
    stdio: 'inherit',
  });
}
