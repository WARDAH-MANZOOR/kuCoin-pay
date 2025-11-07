/*
  Warnings:

  - A unique constraint covering the columns `[kucoinOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundRequestId" TEXT NOT NULL,
    "payOrderId" TEXT NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "refundReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "kucoinRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundRequestId_key" ON "Refund"("refundRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_kucoinOrderId_key" ON "Order"("kucoinOrderId");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_payOrderId_fkey" FOREIGN KEY ("payOrderId") REFERENCES "Order"("kucoinOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;
