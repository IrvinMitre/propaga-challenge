import { DisbursementStatus } from '@propaga/contracts';
import type { Disbursement } from '../domain';

export function createDisbursement(
  overrides: Partial<Disbursement> = {},
): Disbursement {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    tenderoId: 'tendero-test-1',
    distribuidorId: 'distribuidor-test-1',
    amountCents: 100000,
    currency: 'MXN',
    status: DisbursementStatus.Pending,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    decidedAt: null,
    decidedBy: null,
    rejectReason: null,
    ...overrides,
  };
}
