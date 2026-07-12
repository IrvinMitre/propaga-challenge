import type { SeedDisbursementsResult } from '@propaga/contracts';
import type { DisbursementRepository } from '../ports';

export class SeedDisbursementsUseCase {
  constructor(private readonly repository: DisbursementRepository) {}

  execute(): Promise<SeedDisbursementsResult> {
    return this.repository.seed();
  }
}
