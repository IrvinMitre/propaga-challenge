import { DisbursementAction } from '@propaga/contracts';
import { resolveDisbursementTransition, type Disbursement } from '../../domain';
import {
  DisbursementNotFoundError,
  DisbursementTransitionConflictError,
} from '../errors';
import type { DisbursementRepository } from '../ports';

export type ApproveDisbursementInput = {
  id: string;
  actorId: string;
};

export class ApproveDisbursementUseCase {
  constructor(private readonly repository: DisbursementRepository) {}

  async execute(input: ApproveDisbursementInput): Promise<Disbursement> {
    const disbursement = await this.repository.findById(input.id);

    if (disbursement === null) {
      throw new DisbursementNotFoundError(input.id);
    }

    const transition = resolveDisbursementTransition(
      disbursement.status,
      DisbursementAction.Approved,
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
      rejectReason: null,
    });
  }
}
