import {
  ErrorCode,
  type ApiErrorResponse,
  type ApiSuccess,
} from "@propaga/contracts";

export class FrontendApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: ErrorCode,
  ) {
    super(message);
    this.name = "FrontendApiError";
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const body = await readJsonResponse(response);

  if (!response.ok) {
    const apiError = parseApiError(body);

    throw new FrontendApiError(
      apiError.message,
      response.status,
      apiError.code,
    );
  }

  const success = parseApiSuccess<T>(body);

  if (success === null) {
    throw new FrontendApiError(
      "La API respondió con un formato inválido.",
      response.status,
      ErrorCode.InternalError,
    );
  }

  return success.data;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.trim().length === 0) {
    if (response.ok) {
      throw new FrontendApiError(
        "La API respondió sin contenido.",
        response.status,
        ErrorCode.InternalError,
      );
    }

    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new FrontendApiError(
      "La API respondió con JSON inválido.",
      response.status,
      ErrorCode.InternalError,
    );
  }
}

function parseApiSuccess<T>(body: unknown): ApiSuccess<T> | null {
  if (!isRecord(body) || !("data" in body)) {
    return null;
  }

  return { data: body.data as T };
}

function parseApiError(body: unknown): ApiErrorResponse["error"] {
  if (!isRecord(body) || !isRecord(body.error)) {
    return {
      code: ErrorCode.InternalError,
      message: "La API respondió con un error inválido.",
    };
  }

  const code = parseErrorCode(body.error.code);
  const message =
    typeof body.error.message === "string" && body.error.message.length > 0
      ? body.error.message
      : "La API respondió con un error sin mensaje.";

  return { code, message, details: body.error.details };
}

function parseErrorCode(code: unknown): ErrorCode {
  if (
    typeof code === "string" &&
    Object.values(ErrorCode).includes(code as ErrorCode)
  ) {
    return code as ErrorCode;
  }

  return ErrorCode.InternalError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
