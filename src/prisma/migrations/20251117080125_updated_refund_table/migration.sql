/*
  Warnings:

  - You are about to drop the column `payOrderId` on the `Refund` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kucoinRefundId]` on the table `Refund` will be added. If there are existing duplicate values, this will fail.
  - Made the column `payID` on table `Refund` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_payOrderId_fkey";

-- AlterTable
ALTER TABLE "Refund" DROP COLUMN "payOrderId",
ADD COLUMN     "payerDetail" TEXT,
ADD COLUMN     "payerUserId" TEXT,
ADD COLUMN     "retrieveKycStatus" BOOLEAN,
ADD COLUMN     "subMerchantId" TEXT,
ALTER COLUMN "payID" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Refund_kucoinRefundId_key" ON "Refund"("kucoinRefundId");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_payID_fkey" FOREIGN KEY ("payID") REFERENCES "Order"("kucoinOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;
