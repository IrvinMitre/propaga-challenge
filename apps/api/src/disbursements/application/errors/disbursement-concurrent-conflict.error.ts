import type { DisbursementStatus } from '@propaga/contracts';

export class DisbursementConcurrentConflictError extends Error {
  constructor(
    readonly id: string,
    readonly expectedStatus: DisbursementStatus,
    readonly currentStatus: DisbursementStatus,
  ) {
    super(
      `Disbursement "${id}" changed from expected status "${expectedStatus}" to "${currentStatus}" before the decision was applied.`,
    );

    this.name = DisbursementConcurrentConflictError.name;
  }
}
