import {
  DisbursementStatus,
  type DisbursementDto,
} from "@propaga/contracts";

type DisbursementTableProps = {
  items: DisbursementDto[];
  updatingIds: Set<string>;
  approvingId: string | null;
  onStartApprove: (id: string) => void;
  onCancelApprove: () => void;
  onConfirmApprove: (item: DisbursementDto) => void;
  onReject: (item: DisbursementDto) => void;
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DisbursementTable({
  items,
  updatingIds,
  approvingId,
  onStartApprove,
  onCancelApprove,
  onConfirmApprove,
  onReject,
}: DisbursementTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">
              Tendero
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">
              Distribuidor
            </th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">
              Monto
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">
              Estatus
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">
              Creación
            </th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item) => {
            const isUpdating = updatingIds.has(item.id);
            const isConfirming = approvingId === item.id;

            return (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3 font-medium text-zinc-950">
                  {item.tendero_id}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {item.distribuidor_id}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-950">
                  {currencyFormatter.format(item.amount_cents / 100)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-700">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {item.status === DisbursementStatus.Pending ? (
                      isConfirming ? (
                        <>
                          <button
                            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white outline-none hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => onConfirmApprove(item)}
                            disabled={isUpdating}
                          >
                            Confirmar
                          </button>
                          <button
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={onCancelApprove}
                            disabled={isUpdating}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white outline-none hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => onStartApprove(item.id)}
                            disabled={isUpdating}
                          >
                            Aprobar
                          </button>
                          <button
                            className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white outline-none hover:bg-red-800 focus:ring-2 focus:ring-red-700/30 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => onReject(item)}
                            disabled={isUpdating}
                          >
                            Rechazar
                          </button>
                        </>
                      )
                    ) : (
                      <span className="text-xs font-medium text-zinc-500">
                        Sin acciones
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: DisbursementStatus }) {
  const styles = {
    [DisbursementStatus.Pending]: "bg-amber-50 text-amber-800 ring-amber-200",
    [DisbursementStatus.Approved]:
      "bg-emerald-50 text-emerald-800 ring-emerald-200",
    [DisbursementStatus.Rejected]: "bg-red-50 text-red-800 ring-red-200",
  };

  const labels = {
    [DisbursementStatus.Pending]: "Pendiente",
    [DisbursementStatus.Approved]: "Aprobada",
    [DisbursementStatus.Rejected]: "Rechazada",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}
