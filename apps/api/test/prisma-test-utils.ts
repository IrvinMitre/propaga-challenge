import { PrismaService } from '../src/prisma';

export function ensureTestDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error('DATABASE_URL is required for database tests.');
  }

  if (!databaseUrl.includes('test')) {
    throw new Error(
      'Refusing to run database tests because DATABASE_URL does not point to a test database.',
    );
  }
}

export function createPrismaTestService(): PrismaService {
  ensureTestDatabaseUrl();
  return new PrismaService();
}

export async function cleanDisbursementTables(
  prisma: PrismaService,
): Promise<void> {
  await prisma.disbursementAuditLog.deleteMany();
  await prisma.disbursement.deleteMany();
}
