import { config as loadEnvironment } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

loadEnvironment({ path: '../../.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
