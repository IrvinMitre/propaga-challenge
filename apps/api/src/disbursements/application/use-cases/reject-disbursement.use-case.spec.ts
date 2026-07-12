/// <reference types="jest" />

import { DisbursementStatus } from '@propaga/contracts';
import {
  DisbursementRejectReasonRequiredError,
  DisbursementTransitionConflictError,
} from '../errors';
import type { DisbursementRepository } from '../ports';
import { createDisbursement } from '../../test-utils/create-disbursement';
import { RejectDisbursementUseCase } from './reject-disbursement.use-case';

describe('RejectDisbursementUseCase', () => {
  let findByIdMock: jest.MockedFunction<DisbursementRepository['findById']>;
  let findManyMock: jest.MockedFunction<DisbursementRepository['findMany']>;
  let applyDecisionMock: jest.MockedFunction<
    DisbursementRepository['applyDecision']
  >;
  let seedMock: jest.MockedFunction<DisbursementRepository['seed']>;
  let useCase: RejectDisbursementUseCase;

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

    useCase = new RejectDisbursementUseCase(repository);
  });

  it('calls applyDecision when rejecting a pending disbursement', async () => {
    const pendingDisbursement = createDisbursement();
    const rejectedDisbursement = createDisbursement({
      status: DisbursementStatus.Rejected,
      rejectReason: 'Missing documents',
    });
    findByIdMock.mockResolvedValue(pendingDisbursement);
    applyDecisionMock.mockResolvedValue(rejectedDisbursement);

    await expect(
      useCase.execute({
        id: pendingDisbursement.id,
        actorId: 'actor-1',
        rejectReason: '  Missing documents  ',
      }),
    ).resolves.toEqual(rejectedDisbursement);

    expect(applyDecisionMock).toHaveBeenCalledTimes(1);

    const [decisionInput] = applyDecisionMock.mock.calls[0];

    expect(decisionInput).toMatchObject({
      id: pendingDisbursement.id,
      expectedStatus: DisbursementStatus.Pending,
      nextStatus: DisbursementStatus.Rejected,
      decidedBy: 'actor-1',
      rejectReason: 'Missing documents',
    });
    expect(decisionInput.decidedAt).toBeInstanceOf(Date);
  });

  it('throws the validation error when reject reason is empty', async () => {
    await expect(
      useCase.execute({
        id: '11111111-1111-4111-8111-111111111111',
        actorId: 'actor-1',
        rejectReason: '   ',
      }),
    ).rejects.toBeInstanceOf(DisbursementRejectReasonRequiredError);
    expect(findByIdMock).not.toHaveBeenCalled();
    expect(applyDecisionMock).not.toHaveBeenCalled();
  });

  it('does not call applyDecision when rejection is idempotent', async () => {
    const rejectedDisbursement = createDisbursement({
      status: DisbursementStatus.Rejected,
    });
    findByIdMock.mockResolvedValue(rejectedDisbursement);

    await expect(
      useCase.execute({
        id: rejectedDisbursement.id,
        actorId: 'actor-1',
        rejectReason: 'Missing documents',
      }),
    ).resolves.toEqual(rejectedDisbursement);
    expect(applyDecisionMock).not.toHaveBeenCalled();
  });

  it('throws a conflict when rejecting an approved disbursement', async () => {
    findByIdMock.mockResolvedValue(
      createDisbursement({ status: DisbursementStatus.Approved }),
    );

    await expect(
      useCase.execute({
        id: '11111111-1111-4111-8111-111111111111',
        actorId: 'actor-1',
        rejectReason: 'Missing documents',
      }),
    ).rejects.toBeInstanceOf(DisbursementTransitionConflictError);
    expect(applyDecisionMock).not.toHaveBeenCalled();
  });
});
