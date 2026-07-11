import { DisbursementAction, DisbursementStatus } from '@propaga/contracts';

export type DisbursementTransitionResult =
  | {
      type: 'applied';
      nextStatus: DisbursementStatus;
    }
  | {
      type: 'idempotent';
      nextStatus: DisbursementStatus;
    }
  | {
      type: 'conflict';
      currentStatus: DisbursementStatus;
      requestedAction: DisbursementAction;
    };

export function resolveDisbursementTransition(
  currentStatus: DisbursementStatus,
  requestedAction: DisbursementAction,
): DisbursementTransitionResult {
  if (
    currentStatus === DisbursementStatus.Pending &&
    requestedAction === DisbursementAction.Approved
  ) {
    return {
      type: 'applied',
      nextStatus: DisbursementStatus.Approved,
    };
  }

  if (
    currentStatus === DisbursementStatus.Approved &&
    requestedAction === DisbursementAction.Approved
  ) {
    return {
      type: 'idempotent',
      nextStatus: DisbursementStatus.Approved,
    };
  }

  if (
    currentStatus === DisbursementStatus.Rejected &&
    requestedAction === DisbursementAction.Approved
  ) {
    return {
      type: 'conflict',
      currentStatus,
      requestedAction,
    };
  }

  if (
    currentStatus === DisbursementStatus.Pending &&
    requestedAction === DisbursementAction.Rejected
  ) {
    return {
      type: 'applied',
      nextStatus: DisbursementStatus.Rejected,
    };
  }

  if (
    currentStatus === DisbursementStatus.Rejected &&
    requestedAction === DisbursementAction.Rejected
  ) {
    return {
      type: 'idempotent',
      nextStatus: DisbursementStatus.Rejected,
    };
  }

  return {
    type: 'conflict',
    currentStatus,
    requestedAction,
  };
}
