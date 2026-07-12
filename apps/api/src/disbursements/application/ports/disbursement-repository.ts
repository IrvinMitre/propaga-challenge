import type {
  DisbursementStatus,
  SeedDisbursementsResult,
} from '@propaga/contracts';
import type { Disbursement } from '../../domain';

export const DISBURSEMENT_REPOSITORY = Symbol('DISBURSEMENT_REPOSITORY');

export type ListDisbursementsFilters = {
  status?: DisbursementStatus;
  distribuidorId?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  limit: number;
  cursor?: string;
};

export type ListDisbursementsResult = {
  items: Disbursement[];
  nextCursor: string | null;
};

export type ApplyDisbursementDecisionInput = {
  id: string;
  expectedStatus: DisbursementStatus;
  nextStatus: DisbursementStatus;
  decidedBy: string;
  decidedAt: Date;
  rejectReason: string | null;
};

export interface DisbursementRepository {
  findById(id: string): Promise<Disbursement | null>;

  findMany(filters: ListDisbursementsFilters): Promise<ListDisbursementsResult>;

  applyDecision(input: ApplyDisbursementDecisionInput): Promise<Disbursement>;

  seed(): Promise<SeedDisbursementsResult>;
}
