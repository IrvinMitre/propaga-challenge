/// <reference types="jest" />

import { DisbursementStatus } from '@propaga/contracts';
import {
  DisbursementNotFoundError,
  DisbursementTransitionConflictError,
} from '../errors';
import type { DisbursementRepository } from '../ports';
import { createDisbursement } from '../../test-utils/create-disbursement';
import { ApproveDisbursementUseCase } from './approve-disbursement.use-case';

describe('ApproveDisbursementUseCase', () => {
  let findByIdMock: jest.MockedFunction<DisbursementRepository['findById']>;
  let findManyMock: jest.MockedFunction<DisbursementRepository['findMany']>;
  let applyDecisionMock: jest.MockedFunction<
    DisbursementRepository['applyDecision']
  >;
  let seedMock: jest.MockedFunction<DisbursementRepository['seed']>;
  let useCase: ApproveDisbursementUseCase;

  beforeEach(() => {
    findByIdMock = jest.fn();
    findManyMock = jest.fn();
    applyDecisionMock = jest.fn();
    seedMock = jest.fn();

    const repository: DisbursementRepository = {
      findById: findByIdMock,
      findMany: findManyMock,
      applyDecision: applyDecisionMock,
      seed: seedMock,
    };

    useCase = new ApproveDisbursementUseCase(repository);
  });

  it('throws NotFound when the disbursement does not exist', async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', actorId: 'actor-1' }),
    ).rejects.toBeInstanceOf(DisbursementNotFoundError);
    expect(applyDecisionMock).not.toHaveBeenCalled();
  });

  it('calls applyDecision when approving a pending disbursement', async () => {
    const pendingDisbursement = createDisbursement();
    const approvedDisbursement = createDisbursement({
      status: DisbursementStatus.Approved,
    });
    findByIdMock.mockResolvedValue(pendingDisbursement);
    applyDecisionMock.mockResolvedValue(approvedDisbursement);

    await expect(
      useCase.execute({ id: pendingDisbursement.id, actorId: 'actor-1' }),
    ).resolves.toEqual(approvedDisbursement);

    expect(applyDecisionMock).toHaveBeenCalledTimes(1);

    const [decisionInput] = applyDecisionMock.mock.calls[0];

    expect(decisionInput).toMatchObject({
      id: pendingDisbursement.id,
      expectedStatus: DisbursementStatus.Pending,
      nextStatus: DisbursementStatus.Approved,
      decidedBy: 'actor-1',
      rejectReason: null,
    });
    expect(decisionInput.decidedAt).toBeInstanceOf(Date);
  });

  it('does not call applyDecision when approval is idempotent', async () => {
    const approvedDisbursement = createDisbursement({
      status: DisbursementStatus.Approved,
    });
    findByIdMock.mockResolvedValue(approvedDisbursement);

    await expect(
      useCase.execute({ id: approvedDisbursement.id, actorId: 'actor-1' }),
    ).resolves.toEqual(approvedDisbursement);
    expect(applyDecisionMock).not.toHaveBeenCalled();
  });

  it('throws a conflict when approving a rejected disbursement', async () => {
    findByIdMock.mockResolvedValue(
      createDisbursement({ status: DisbursementStatus.Rejected }),
    );

    await expect(
      useCase.execute({
        id: '11111111-1111-4111-8111-111111111111',
        actorId: 'actor-1',
      }),
    ).rejects.toBeInstanceOf(DisbursementTransitionConflictError);
    expect(applyDecisionMock).not.toHaveBeenCalled();
  });
});
