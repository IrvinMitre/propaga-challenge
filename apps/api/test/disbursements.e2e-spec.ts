/// <reference types="jest" />

import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ErrorCode } from '@propaga/contracts';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DisbursementStatus as PrismaDisbursementStatus } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma';
import { cleanDisbursementTables } from './prisma-test-utils';

describe('Disbursements API', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('v1');
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDisbursementTables(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns validation error when approving without x-actor-id', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/disbursements/aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa/approve')
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: ErrorCode.ValidationError,
      },
    });
  });

  it('returns conflict when rejecting an approved disbursement', async () => {
    const disbursementId = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb';

    await prisma.disbursement.create({
      data: {
        id: disbursementId,
        tenderoId: 'tendero-e2e-1',
        distribuidorId: 'distribuidor-e2e-1',
        amountCents: 250000,
        currency: 'MXN',
        status: PrismaDisbursementStatus.approved,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        decidedAt: new Date('2026-01-02T00:00:00.000Z'),
        decidedBy: 'actor-e2e-1',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/v1/disbursements/${disbursementId}/reject`)
      .set('x-actor-id', 'actor-e2e-2')
      .send({ reason: 'Invalid documents' })
      .expect(409);

    expect(response.body).toMatchObject({
      error: {
        code: ErrorCode.InvalidStateTransition,
      },
    });
  });
});
