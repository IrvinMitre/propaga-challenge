import type { Disbursement } from '../../domain';
import { DisbursementNotFoundError } from '../errors';
import type { DisbursementRepository } from '../ports';

export type GetDisbursementInput = {
  id: string;
};

export class GetDisbursementUseCase {
  constructor(private readonly repository: DisbursementRepository) {}

  async execute(input: GetDisbursementInput): Promise<Disbursement> {
    const disbursement = await this.repository.findById(input.id);

    if (disbursement === null) {
      throw new DisbursementNotFoundError(input.id);
    }

    return disbursement;
  }
}
