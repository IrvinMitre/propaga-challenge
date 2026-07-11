export class DisbursementNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Disbursement with id "${id}" was not found.`);
    this.name = DisbursementNotFoundError.name;
  }
}
