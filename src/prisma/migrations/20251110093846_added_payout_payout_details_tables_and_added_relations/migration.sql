/*
  Warnings:

  - You are about to drop the `WebhookLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "WebhookLog";

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "batchNo" TEXT,
    "payoutType" TEXT NOT NULL,
    "batchName" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "chain" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutDetail" (
    "id" TEXT NOT NULL,
    "detailId" TEXT NOT NULL,
    "receiverUID" TEXT,
    "receiverAddress" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_requestId_key" ON "Payout"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutDetail_detailId_key" ON "PayoutDetail"("detailId");

-- AddForeignKey
ALTER TABLE "PayoutDetail" ADD CONSTRAINT "PayoutDetail_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
