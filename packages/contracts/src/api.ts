export type ApiSuccess<T> = {
  data: T;
};

export enum ErrorCode {
  ValidationError = 'VALIDATION_ERROR',
  DisbursementNotFound = 'DISBURSEMENT_NOT_FOUND',
  InvalidStateTransition = 'INVALID_STATE_TRANSITION',
  InvalidCursor = 'INVALID_CURSOR',
  InternalError = 'INTERNAL_ERROR',
}

export type ApiError = {
  code: ErrorCode;
  message: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  error: ApiError;
};

export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
};
