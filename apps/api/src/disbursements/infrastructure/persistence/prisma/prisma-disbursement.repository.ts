import { Injectable } from '@nestjs/common';
import { DisbursementStatus } from '@propaga/contracts';
import type { Disbursement } from '../../../domain';
import type {
  ApplyDisbursementDecisionInput,
  DisbursementRepository,
  ListDisbursementsFilters,
  ListDisbursementsResult,
} from '../../../application/ports';
import {
  DisbursementConcurrentConflictError,
  DisbursementNotFoundError,
} from '../../../application/errors';
import { PrismaService } from '../../../../prisma';
import {
  DisbursementAction as PrismaDisbursementAction,
  type Prisma,
} from '../../../../generated/prisma/client';
import {
  toDomainDisbursement,
  toDomainDisbursementStatus,
  toPrismaDisbursementStatus,
} from './disbursement.mapper';

@Injectable()
export class PrismaDisbursementRepository implements DisbursementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Disbursement | null> {
    const disbursement = await this.prisma.disbursement.findUnique({
      where: { id },
    });

    if (disbursement === null) {
      return null;
    }

    return toDomainDisbursement(disbursement);
  }

  async findMany(
    filters: ListDisbursementsFilters,
  ): Promise<ListDisbursementsResult> {
    const where: Prisma.DisbursementWhereInput = {};

    if (filters.status !== undefined) {
      where.status = toPrismaDisbursementStatus(filters.status);
    }

    if (filters.distribuidorId !== undefined) {
      where.distribuidorId = filters.distribuidorId;
    }

    if (
      filters.minAmountCents !== undefined ||
      filters.maxAmountCents !== undefined
    ) {
      where.amountCents = {
        gte: filters.minAmountCents,
        lte: filters.maxAmountCents,
      };
    }

    const disbursements = await this.prisma.disbursement.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filters.limit + 1,
      ...(filters.cursor !== undefined
        ? {
            cursor: { id: filters.cursor },
            skip: 1,
          }
        : {}),
    });

    const items = disbursements.slice(0, filters.limit);
    const nextCursor =
      disbursements.length > filters.limit
        ? disbursements[filters.limit].id
        : null;

    return {
      items: items.map(toDomainDisbursement),
      nextCursor,
    };
  }

  async applyDecision(
    input: ApplyDisbursementDecisionInput,
  ): Promise<Disbursement> {
    const disbursement = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.disbursement.updateMany({
        where: {
          id: input.id,
          status: toPrismaDisbursementStatus(input.expectedStatus),
        },
        data: {
          status: toPrismaDisbursementStatus(input.nextStatus),
          decidedBy: input.decidedBy,
          decidedAt: input.decidedAt,
          rejectReason: input.rejectReason,
        },
      });

      if (updateResult.count === 0) {
        const currentDisbursement = await tx.disbursement.findUnique({
          where: { id: input.id },
        });

        if (currentDisbursement === null) {
          throw new DisbursementNotFoundError(input.id);
        }

        const currentStatus = toDomainDisbursementStatus(
          currentDisbursement.status,
        );

        if (currentStatus === input.nextStatus) {
          return currentDisbursement;
        }

        throw new DisbursementConcurrentConflictError(
          input.id,
          input.expectedStatus,
          currentStatus,
        );
      }

      await tx.disbursementAuditLog.create({
        data: {
          disbursementId: input.id,
          action: toPrismaDisbursementAction(input.nextStatus),
          actorId: input.decidedBy,
          reason: input.rejectReason,
        },
      });

      const updatedDisbursement = await tx.disbursement.findUnique({
        where: { id: input.id },
      });

      if (updatedDisbursement === null) {
        throw new Error(
          `Disbursement "${input.id}" was updated but could not be read.`,
        );
      }

      return updatedDisbursement;
    });

    return toDomainDisbursement(disbursement);
  }
}

function toPrismaDisbursementAction(
  status: DisbursementStatus,
): PrismaDisbursementAction {
  switch (status) {
    case DisbursementStatus.Approved:
      return PrismaDisbursementAction.approved;
    case DisbursementStatus.Rejected:
      return PrismaDisbursementAction.rejected;
    case DisbursementStatus.Pending:
      throw new Error('Pending status cannot be persisted as a decision.');
  }
}
