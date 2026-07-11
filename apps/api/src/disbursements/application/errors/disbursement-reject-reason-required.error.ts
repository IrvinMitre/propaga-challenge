export class DisbursementRejectReasonRequiredError extends Error {
  constructor() {
    super('A reject reason is required to reject a disbursement.');
    this.name = DisbursementRejectReasonRequiredError.name;
  }
}
