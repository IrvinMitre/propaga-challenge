import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ErrorCode, type ApiErrorResponse } from '@propaga/contracts';
import type { Response } from 'express';
import {
  DisbursementConcurrentConflictError,
  DisbursementNotFoundError,
  DisbursementRejectReasonRequiredError,
  DisbursementTransitionConflictError,
} from '../../../application/errors';

type DisbursementApplicationError =
  | DisbursementConcurrentConflictError
  | DisbursementNotFoundError
  | DisbursementRejectReasonRequiredError
  | DisbursementTransitionConflictError;

@Catch(
  DisbursementConcurrentConflictError,
  DisbursementNotFoundError,
  DisbursementRejectReasonRequiredError,
  DisbursementTransitionConflictError,
)
export class DisbursementExceptionFilter implements ExceptionFilter<DisbursementApplicationError> {
  catch(exception: DisbursementApplicationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, body } = this.toHttpError(exception);

    response.status(statusCode).json(body);
  }

  private toHttpError(exception: DisbursementApplicationError): {
    statusCode: HttpStatus;
    body: ApiErrorResponse;
  } {
    if (exception instanceof DisbursementNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: {
          error: {
            code: ErrorCode.DisbursementNotFound,
            message: exception.message,
          },
        },
      };
    }

    if (exception instanceof DisbursementRejectReasonRequiredError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: {
          error: {
            code: ErrorCode.ValidationError,
            message: exception.message,
          },
        },
      };
    }

    return {
      statusCode: HttpStatus.CONFLICT,
      body: {
        error: {
          code: ErrorCode.InvalidStateTransition,
          message: exception.message,
        },
      },
    };
  }
}
