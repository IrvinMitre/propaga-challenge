-- CreateEnum
CREATE TYPE "disbursement_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "disbursement_action" AS ENUM ('approved', 'rejected');

-- CreateTable
CREATE TABLE "disbursements" (
    "id" UUID NOT NULL,
    "tendero_id" TEXT NOT NULL,
    "distribuidor_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "status" "disbursement_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" TEXT,
    "reject_reason" TEXT,

    CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disbursement_audit_logs" (
    "id" UUID NOT NULL,
    "disbursement_id" UUID NOT NULL,
    "action" "disbursement_action" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disbursement_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disbursements_created_at_id_idx" ON "disbursements"("created_at", "id");

-- CreateIndex
CREATE INDEX "disbursements_status_idx" ON "disbursements"("status");

-- CreateIndex
CREATE INDEX "disbursements_distribuidor_id_idx" ON "disbursements"("distribuidor_id");

-- CreateIndex
CREATE INDEX "disbursements_amount_cents_idx" ON "disbursements"("amount_cents");

-- CreateIndex
CREATE INDEX "disbursement_audit_logs_disbursement_id_idx" ON "disbursement_audit_logs"("disbursement_id");

-- AddForeignKey
ALTER TABLE "disbursement_audit_logs" ADD CONSTRAINT "disbursement_audit_logs_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "disbursements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
