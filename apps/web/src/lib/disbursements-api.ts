import type {
  DisbursementDto,
  ListDisbursementsQuery,
  ListDisbursementsResponse,
  RejectDisbursementDto,
} from "@propaga/contracts";
import { apiFetch } from "./api";
import { OPS_ACTOR_ID } from "./constants";

const DISBURSEMENTS_PATH = "/api/v1/disbursements";

export function listDisbursements(
  query: ListDisbursementsQuery,
): Promise<ListDisbursementsResponse> {
  const searchParams = new URLSearchParams();

  addParam(searchParams, "status", query.status);
  addParam(searchParams, "distributor", query.distributor);
  addParam(searchParams, "min_amount", query.min_amount);
  addParam(searchParams, "max_amount", query.max_amount);
  addParam(searchParams, "limit", query.limit);
  addParam(searchParams, "cursor", query.cursor);

  const queryString = searchParams.toString();
  const url =
    queryString.length > 0
      ? `${DISBURSEMENTS_PATH}?${queryString}`
      : DISBURSEMENTS_PATH;

  return apiFetch<ListDisbursementsResponse>(url);
}

export function approveDisbursement(id: string): Promise<DisbursementDto> {
  return apiFetch<DisbursementDto>(
    `${DISBURSEMENTS_PATH}/${encodeURIComponent(id)}/approve`,
    {
      method: "POST",
      headers: {
        "x-actor-id": OPS_ACTOR_ID,
      },
    },
  );
}

export function rejectDisbursement(
  id: string,
  body: RejectDisbursementDto,
): Promise<DisbursementDto> {
  return apiFetch<DisbursementDto>(
    `${DISBURSEMENTS_PATH}/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-actor-id": OPS_ACTOR_ID,
      },
      body: JSON.stringify(body),
    },
  );
}

function addParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined || value === "") {
    return;
  }

  searchParams.set(key, String(value));
}
