import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ensureTestDatabaseUrl } from './prisma-test-utils';

export default function globalSetup(): void {
  ensureTestDatabaseUrl();

  execFileSync('pnpm', ['--filter', '@propaga/api', 'prisma:migrate:deploy'], {
    cwd: resolve(__dirname, '../../..'),
    env: process.env,
    stdio: 'inherit',
  });
}
