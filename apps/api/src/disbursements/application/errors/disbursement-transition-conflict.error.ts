import type {
  DisbursementAction,
  DisbursementStatus,
} from '@propaga/contracts';

export class DisbursementTransitionConflictError extends Error {
  constructor(
    readonly currentStatus: DisbursementStatus,
    readonly requestedAction: DisbursementAction,
  ) {
    super(
      `Cannot apply disbursement action "${requestedAction}" from status "${currentStatus}".`,
    );
    this.name = DisbursementTransitionConflictError.name;
  }
}
