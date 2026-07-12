"use client";

import { useEffect, useId, useState } from "react";
import {
  RejectDisbursementRequestSchema,
  type DisbursementDto,
  type RejectDisbursementDto,
} from "@propaga/contracts";

type RejectModalProps = {
  item: DisbursementDto | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (body: RejectDisbursementDto) => void;
};

export function RejectModal({
  item,
  isSubmitting,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, item, onClose]);

  if (item === null) {
    return null;
  }

  function handleConfirm() {
    const parsed = RejectDisbursementRequestSchema.safeParse({ reason });

    if (!parsed.success) {
      setError("Captura un motivo para rechazar la dispersión.");
      return;
    }

    setError(null);
    onConfirm(parsed.data);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950" id={titleId}>
              Rechazar dispersión
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Tendero {item.tendero_id} · Distribuidor {item.distribuidor_id}
            </p>
          </div>
          <button
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-zinc-500 outline-none hover:bg-zinc-100 focus:ring-2 focus:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            X
          </button>
        </div>

        <label className="mt-5 flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Motivo
          <textarea
            className="min-h-28 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 disabled:cursor-not-allowed disabled:bg-zinc-50"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isSubmitting}
          />
        </label>

        {error ? (
          <p className="mt-2 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950/20 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-red-800 focus:ring-2 focus:ring-red-700/30 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rechazando..." : "Confirmar rechazo"}
          </button>
        </div>
      </div>
    </div>
  );
}
