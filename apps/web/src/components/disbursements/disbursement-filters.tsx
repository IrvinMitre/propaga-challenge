import { DisbursementStatus } from "@propaga/contracts";

export type DisbursementFilterValues = {
  status: DisbursementStatus | "all";
  distributor: string;
  minAmountMxn: string;
  maxAmountMxn: string;
};

type DisbursementFiltersProps = {
  values: DisbursementFilterValues;
  error: string | null;
  isLoading: boolean;
  onChange: (values: DisbursementFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
};

export function DisbursementFilters({
  values,
  error,
  isLoading,
  onChange,
  onApply,
  onClear,
}: DisbursementFiltersProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Estatus
          <select
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            value={values.status}
            onChange={(event) =>
              onChange({
                ...values,
                status: event.target.value as DisbursementFilterValues["status"],
              })
            }
          >
            <option value={DisbursementStatus.Pending}>Pendiente</option>
            <option value={DisbursementStatus.Approved}>Aprobada</option>
            <option value={DisbursementStatus.Rejected}>Rechazada</option>
            <option value="all">Todas</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Distribuidor
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            type="text"
            value={values.distributor}
            onChange={(event) =>
              onChange({ ...values, distributor: event.target.value })
            }
            placeholder="ID de distribuidor"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Monto mínimo (MXN)
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            type="number"
            min="0"
            step="0.01"
            value={values.minAmountMxn}
            onChange={(event) =>
              onChange({ ...values, minAmountMxn: event.target.value })
            }
            placeholder="0.00"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Monto máximo (MXN)
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            type="number"
            min="0"
            step="0.01"
            value={values.maxAmountMxn}
            onChange={(event) =>
              onChange({ ...values, maxAmountMxn: event.target.value })
            }
            placeholder="0.00"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Los montos se capturan en MXN y se envían a la API en centavos.
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onClear}
            disabled={isLoading}
          >
            Limpiar
          </button>
          <button
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-950/30 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onApply}
            disabled={isLoading}
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
