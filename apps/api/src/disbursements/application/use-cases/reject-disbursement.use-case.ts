import { DisbursementAction } from '@propaga/contracts';
import { resolveDisbursementTransition, type Disbursement } from '../../domain';
import {
  DisbursementNotFoundError,
  DisbursementRejectReasonRequiredError,
  DisbursementTransitionConflictError,
} from '../errors';
import type { DisbursementRepository } from '../ports';

export type RejectDisbursementInput = {
  id: string;
  actorId: string;
  rejectReason: string;
};

export class RejectDisbursementUseCase {
  constructor(private readonly repository: DisbursementRepository) {}

  async execute(input: RejectDisbursementInput): Promise<Disbursement> {
    const normalizedRejectReason = input.rejectReason.trim();

    if (normalizedRejectReason.length === 0) {
      throw new DisbursementRejectReasonRequiredError();
    }

    const disbursement = await this.repository.findById(input.id);

    if (disbursement === null) {
      throw new DisbursementNotFoundError(input.id);
    }

    const transition = resolveDisbursementTransition(
      disbursement.status,
      DisbursementAction.Rejected,
    );

    if (transition.type === 'conflict') {
      throw new DisbursementTransitionConflictError(
        transition.currentStatus,
        transition.requestedAction,
      );
    }

    if (transition.type === 'idempotent') {
      return disbursement;
    }

    return this.repository.applyDecision({
      id: input.id,
      expectedStatus: disbursement.status,
      nextStatus: transition.nextStatus,
      decidedBy: input.actorId,
      decidedAt: new Date(),
      rejectReason: normalizedRejectReason,
    });
  }
}
