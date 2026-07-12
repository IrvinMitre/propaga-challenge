"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DisbursementStatus,
  type DisbursementDto,
  type ListDisbursementsQuery,
  type RejectDisbursementDto,
} from "@propaga/contracts";
import { FrontendApiError } from "@/lib/api";
import {
  approveDisbursement,
  listDisbursements,
  rejectDisbursement,
} from "@/lib/disbursements-api";
import { OPS_ACTOR_ID } from "@/lib/constants";
import {
  DisbursementFilters,
  type DisbursementFilterValues,
} from "./disbursement-filters";
import { DisbursementTable } from "./disbursement-table";
import { RejectModal } from "./reject-modal";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: DisbursementFilterValues = {
  status: DisbursementStatus.Pending,
  distributor: "",
  minAmountMxn: "",
  maxAmountMxn: "",
};

const DEFAULT_QUERY: ListDisbursementsQuery = {
  status: DisbursementStatus.Pending,
  limit: PAGE_SIZE,
};

export function DisbursementsPage() {
  const [filters, setFilters] =
    useState<DisbursementFilterValues>(DEFAULT_FILTERS);
  const [activeQuery, setActiveQuery] =
    useState<ListDisbursementsQuery>(DEFAULT_QUERY);
  const [items, setItems] = useState<DisbursementDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<DisbursementDto | null>(
    null,
  );
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let didCancel = false;

    async function loadInitialPage() {
      try {
        const response = await listDisbursements(DEFAULT_QUERY);

        if (didCancel) {
          return;
        }

        setItems(response.items);
        setNextCursor(response.next_cursor);
      } catch (error) {
        if (!didCancel) {
          setApiError(getErrorMessage(error));
        }
      } finally {
        if (!didCancel) {
          setInitialLoading(false);
        }
      }
    }

    void loadInitialPage();

    return () => {
      didCancel = true;
    };
  }, []);

  const loadFirstPage = useCallback(
    async (query: ListDisbursementsQuery, loadingKind: "initial" | "filter") => {
      setApiError(null);

      if (loadingKind === "initial") {
        setInitialLoading(true);
      } else {
        setFilterLoading(true);
      }

      try {
        const response = await listDisbursements({ ...query, cursor: undefined });
        setItems(response.items);
        setNextCursor(response.next_cursor);
        return true;
      } catch (error) {
        setApiError(getErrorMessage(error));
        return false;
      } finally {
        setInitialLoading(false);
        setFilterLoading(false);
      }
    },
    [],
  );

  async function handleApplyFilters() {
    const result = buildQuery(filters);

    if (!result.ok) {
      setValidationError(result.message);
      return;
    }

    setValidationError(null);
    const didLoad = await loadFirstPage(result.query, "filter");

    if (didLoad) {
      setActiveQuery(result.query);
      setApprovingId(null);
    }
  }

  async function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setValidationError(null);
    const didLoad = await loadFirstPage(DEFAULT_QUERY, "filter");

    if (didLoad) {
      setActiveQuery(DEFAULT_QUERY);
      setApprovingId(null);
    }
  }

  async function handleLoadMore() {
    if (nextCursor === null || pageLoading) {
      return;
    }

    setApiError(null);
    setPageLoading(true);

    try {
      const response = await listDisbursements({
        ...activeQuery,
        cursor: nextCursor,
      });

      setItems((currentItems) =>
        appendUniqueById(currentItems, response.items),
      );
      setNextCursor(response.next_cursor);
    } catch (error) {
      setApiError(getErrorMessage(error));
    } finally {
      setPageLoading(false);
    }
  }

  async function handleApprove(item: DisbursementDto) {
    setApprovingId(null);
    setApiError(null);
    setUpdating(item.id, true);

    const previousItem = item;
    const optimisticItem = createOptimisticItem(
      item,
      DisbursementStatus.Approved,
      null,
    );

    replaceItem(optimisticItem);

    try {
      const serverItem = await approveDisbursement(item.id);
      applyConfirmedMutation(serverItem);
    } catch (error) {
      replaceItem(previousItem);
      setApiError(getErrorMessage(error));
    } finally {
      setUpdating(item.id, false);
    }
  }

  async function handleReject(body: RejectDisbursementDto) {
    if (rejectingItem === null) {
      return;
    }

    setApiError(null);
    setRejectSubmitting(true);
    setUpdating(rejectingItem.id, true);

    const previousItem = rejectingItem;
    const optimisticItem = createOptimisticItem(
      rejectingItem,
      DisbursementStatus.Rejected,
      body.reason,
    );

    replaceItem(optimisticItem);

    try {
      const serverItem = await rejectDisbursement(rejectingItem.id, body);
      applyConfirmedMutation(serverItem);
      setRejectingItem(null);
    } catch (error) {
      replaceItem(previousItem);
      setApiError(getErrorMessage(error));
    } finally {
      setRejectSubmitting(false);
      setUpdating(rejectingItem.id, false);
    }
  }

  function replaceItem(nextItem: DisbursementDto) {
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === nextItem.id ? nextItem : currentItem,
      ),
    );
  }

  function applyConfirmedMutation(serverItem: DisbursementDto) {
    if (activeQuery.status === DisbursementStatus.Pending) {
      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== serverItem.id),
      );
      return;
    }

    replaceItem(serverItem);
  }

  function setUpdating(id: string, isUpdating: boolean) {
    setUpdatingIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isUpdating) {
        nextIds.add(id);
      } else {
        nextIds.delete(id);
      }

      return nextIds;
    });
  }

  const isLoadingList = initialLoading || filterLoading;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-normal">
            Consola de dispersiones
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Revisa dispersiones, filtra por criterios operativos y decide las
            solicitudes pendientes.
          </p>
        </header>

        <DisbursementFilters
          values={filters}
          error={validationError}
          isLoading={filterLoading}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-zinc-700" aria-live="polite">
              {items.length} registro{items.length === 1 ? "" : "s"} cargado
              {items.length === 1 ? "" : "s"}
            </p>
            {filterLoading ? (
              <p className="text-sm text-zinc-500" aria-live="polite">
                Aplicando filtros...
              </p>
            ) : null}
          </div>

          {apiError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              role="alert"
            >
              {apiError}
            </div>
          ) : null}

          {initialLoading ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
              Cargando dispersiones...
            </div>
          ) : items.length === 0 && !isLoadingList ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
              <p className="font-medium text-zinc-950">Sin dispersiones</p>
              <p className="mt-1 text-sm text-zinc-600">
                No hay registros para los filtros seleccionados.
              </p>
            </div>
          ) : (
            <DisbursementTable
              items={items}
              updatingIds={updatingIds}
              approvingId={approvingId}
              onStartApprove={setApprovingId}
              onCancelApprove={() => setApprovingId(null)}
              onConfirmApprove={handleApprove}
              onReject={setRejectingItem}
            />
          )}

          {nextCursor !== null ? (
            <div className="flex justify-center">
              <button
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleLoadMore}
                disabled={pageLoading}
              >
                {pageLoading ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <RejectModal
        key={rejectingItem?.id ?? "closed"}
        item={rejectingItem}
        isSubmitting={rejectSubmitting}
        onClose={() => setRejectingItem(null)}
        onConfirm={handleReject}
      />
    </main>
  );
}

function buildQuery(
  filters: DisbursementFilterValues,
):
  | { ok: true; query: ListDisbursementsQuery }
  | { ok: false; message: string } {
  const minAmount = parseMxnToCents(filters.minAmountMxn, "monto mínimo");
  const maxAmount = parseMxnToCents(filters.maxAmountMxn, "monto máximo");

  if (!minAmount.ok) {
    return minAmount;
  }

  if (!maxAmount.ok) {
    return maxAmount;
  }

  if (
    minAmount.value !== undefined &&
    maxAmount.value !== undefined &&
    minAmount.value > maxAmount.value
  ) {
    return {
      ok: false,
      message: "El monto mínimo no puede ser mayor que el monto máximo.",
    };
  }

  return {
    ok: true,
    query: {
      status: filters.status === "all" ? undefined : filters.status,
      distributor: filters.distributor.trim() || undefined,
      min_amount: minAmount.value,
      max_amount: maxAmount.value,
      limit: PAGE_SIZE,
    },
  };
}

function parseMxnToCents(
  value: string,
  label: string,
): { ok: true; value: number | undefined } | { ok: false; message: string } {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return { ok: true, value: undefined };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return {
      ok: false,
      message: `El ${label} debe ser un número no negativo con máximo dos decimales.`,
    };
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return {
      ok: false,
      message: `El ${label} debe ser un número no negativo.`,
    };
  }

  return { ok: true, value: Math.round(parsedValue * 100) };
}

function createOptimisticItem(
  item: DisbursementDto,
  status: DisbursementStatus.Approved | DisbursementStatus.Rejected,
  rejectReason: string | null,
): DisbursementDto {
  return {
    ...item,
    status,
    decided_at: new Date().toISOString(),
    decided_by: OPS_ACTOR_ID,
    reject_reason: rejectReason,
  };
}

function appendUniqueById(
  currentItems: DisbursementDto[],
  nextItems: DisbursementDto[],
): DisbursementDto[] {
  const knownIds = new Set(currentItems.map((item) => item.id));
  const uniqueNextItems = nextItems.filter((item) => !knownIds.has(item.id));

  return [...currentItems, ...uniqueNextItems];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof FrontendApiError) {
    return `${error.message} (${error.code}, HTTP ${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}
