import type { z } from 'zod';
import type { CursorPage } from '../api';
import type { DisbursementAction, DisbursementStatus } from '../enums';
import type { RejectDisbursementRequestSchema } from '../schemas';

export type DisbursementDto = {
  id: string;
  tendero_id: string;
  distribuidor_id: string;
  amount_cents: number;
  currency: string;
  status: DisbursementStatus;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  reject_reason: string | null;
};

export type DisbursementAuditLogDto = {
  id: string;
  disbursement_id: string;
  action: DisbursementAction;
  actor_id: string;
  reason: string | null;
  created_at: string;
};

export type DisbursementDetailDto = DisbursementDto & {
  audit_logs: DisbursementAuditLogDto[];
};

export type ListDisbursementsQuery = {
  status?: DisbursementStatus;
  distributor?: string;
  min_amount?: number;
  max_amount?: number;
  limit?: number;
  cursor?: string;
};

export type ListDisbursementsResponse = CursorPage<DisbursementDto>;

export type RejectDisbursementDto = z.infer<
  typeof RejectDisbursementRequestSchema
>;
