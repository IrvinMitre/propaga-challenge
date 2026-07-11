import type { DisbursementStatus } from '@propaga/contracts';

export type Disbursement = {
  id: string;
  tenderoId: string;
  distribuidorId: string;
  amountCents: number;
  currency: string;
  status: DisbursementStatus;
  createdAt: Date;
  decidedAt: Date | null;
  decidedBy: string | null;
  rejectReason: string | null;
};
