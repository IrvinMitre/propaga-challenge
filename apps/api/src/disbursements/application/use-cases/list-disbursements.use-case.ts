import type {
  DisbursementRepository,
  ListDisbursementsFilters,
  ListDisbursementsResult,
} from '../ports';

export class ListDisbursementsUseCase {
  constructor(private readonly repository: DisbursementRepository) {}

  execute(filters: ListDisbursementsFilters): Promise<ListDisbursementsResult> {
    return this.repository.findMany(filters);
  }
}
