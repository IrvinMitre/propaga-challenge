import type { DisbursementStatus } from '@propaga/contracts';

export class ListDisbursementsQueryDto {
  status?: DisbursementStatus;
  distributor?: string;
  min_amount?: string;
  max_amount?: string;
  limit?: string;
  cursor?: string;
}
