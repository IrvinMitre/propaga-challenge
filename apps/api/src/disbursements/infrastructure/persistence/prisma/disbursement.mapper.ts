import { DisbursementStatus } from '@propaga/contracts';
import {
  DisbursementStatus as PrismaDisbursementStatus,
  type Disbursement as PrismaDisbursement,
} from '../../../../generated/prisma/client';
import type { Disbursement as DomainDisbursement } from '../../../domain';

export function toDomainDisbursement(
  disbursement: PrismaDisbursement,
): DomainDisbursement {
  return {
    id: disbursement.id,
    tenderoId: disbursement.tenderoId,
    distribuidorId: disbursement.distribuidorId,
    amountCents: disbursement.amountCents,
    currency: disbursement.currency,
    status: toDomainDisbursementStatus(disbursement.status),
    createdAt: disbursement.createdAt,
    decidedAt: disbursement.decidedAt,
    decidedBy: disbursement.decidedBy,
    rejectReason: disbursement.rejectReason,
  };
}

export function toPrismaDisbursementStatus(
  status: DisbursementStatus,
): PrismaDisbursementStatus {
  switch (status) {
    case DisbursementStatus.Pending:
      return PrismaDisbursementStatus.pending;
    case DisbursementStatus.Approved:
      return PrismaDisbursementStatus.approved;
    case DisbursementStatus.Rejected:
      return PrismaDisbursementStatus.rejected;
  }
}

export function toDomainDisbursementStatus(
  status: PrismaDisbursementStatus,
): DisbursementStatus {
  switch (status) {
    case PrismaDisbursementStatus.pending:
      return DisbursementStatus.Pending;
    case PrismaDisbursementStatus.approved:
      return DisbursementStatus.Approved;
    case PrismaDisbursementStatus.rejected:
      return DisbursementStatus.Rejected;
  }
}
