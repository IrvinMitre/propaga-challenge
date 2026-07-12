/// <reference types="jest" />

import { DisbursementStatus } from '@propaga/contracts';
import { PrismaService } from '../../../../prisma';
import { DisbursementStatus as PrismaDisbursementStatus } from '../../../../generated/prisma/client';
import {
  cleanDisbursementTables,
  createPrismaTestService,
} from '../../../../../test/prisma-test-utils';
import { PrismaDisbursementRepository } from './prisma-disbursement.repository';

describe('PrismaDisbursementRepository.applyDecision', () => {
  let prisma: PrismaService;
  let repository: PrismaDisbursementRepository;

  beforeAll(async () => {
    prisma = createPrismaTestService();
    await prisma.$connect();
    repository = new PrismaDisbursementRepository(prisma);
  });

  beforeEach(async () => {
    await cleanDisbursementTables(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('applies one concurrent approval and creates only one audit log', async () => {
    const disbursementId = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';

    await prisma.disbursement.create({
      data: {
        id: disbursementId,
        tenderoId: 'tendero-concurrency-1',
        distribuidorId: 'distribuidor-concurrency-1',
        amountCents: 100000,
        currency: 'MXN',
        status: PrismaDisbursementStatus.pending,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    const decisionInput = {
      id: disbursementId,
      expectedStatus: DisbursementStatus.Pending,
      nextStatus: DisbursementStatus.Approved,
      decidedBy: 'actor-concurrency-1',
      decidedAt: new Date('2026-01-02T00:00:00.000Z'),
      rejectReason: null,
    };

    const results = await Promise.allSettled([
      repository.applyDecision(decisionInput),
      repository.applyDecision(decisionInput),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);

    const disbursement = await prisma.disbursement.findUniqueOrThrow({
      where: { id: disbursementId },
    });
    const auditLogCount = await prisma.disbursementAuditLog.count({
      where: { disbursementId },
    });

    expect(disbursement.status).toBe(PrismaDisbursementStatus.approved);
    expect(auditLogCount).toBe(1);
  });
});
