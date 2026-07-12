/// <reference types="jest" />

import { DisbursementAction, DisbursementStatus } from '@propaga/contracts';
import { resolveDisbursementTransition } from './disbursement-state-machine';

describe('resolveDisbursementTransition', () => {
  it('returns an applied result when approving a pending disbursement', () => {
    expect(
      resolveDisbursementTransition(
        DisbursementStatus.Pending,
        DisbursementAction.Approved,
      ),
    ).toEqual({
      type: 'applied',
      nextStatus: DisbursementStatus.Approved,
    });
  });

  it('returns an applied result when rejecting a pending disbursement', () => {
    expect(
      resolveDisbursementTransition(
        DisbursementStatus.Pending,
        DisbursementAction.Rejected,
      ),
    ).toEqual({
      type: 'applied',
      nextStatus: DisbursementStatus.Rejected,
    });
  });

  it('returns an idempotent result when approving an approved disbursement', () => {
    expect(
      resolveDisbursementTransition(
        DisbursementStatus.Approved,
        DisbursementAction.Approved,
      ),
    ).toEqual({
      type: 'idempotent',
      nextStatus: DisbursementStatus.Approved,
    });
  });

  it('returns an idempotent result when rejecting a rejected disbursement', () => {
    expect(
      resolveDisbursementTransition(
        DisbursementStatus.Rejected,
        DisbursementAction.Rejected,
      ),
    ).toEqual({
      type: 'idempotent',
      nextStatus: DisbursementStatus.Rejected,
    });
  });

  it('returns a conflict result when rejecting an approved disbursement', () => {
    expect(
      resolveDisbursementTransition(
        DisbursementStatus.Approved,
        DisbursementAction.Rejected,
      ),
    ).toEqual({
      type: 'conflict',
      currentStatus: DisbursementStatus.Approved,
      requestedAction: DisbursementAction.Rejected,
    });
  });

  it('returns a conflict result when approving a rejected disbursement', () => {
    expect(
      resolveDisbursementTransition(
        DisbursementStatus.Rejected,
        DisbursementAction.Approved,
      ),
    ).toEqual({
      type: 'conflict',
      currentStatus: DisbursementStatus.Rejected,
      requestedAction: DisbursementAction.Approved,
    });
  });
});
