-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_payID_fkey";

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "payOrderId" TEXT,
ALTER COLUMN "payID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_payOrderId_fkey" FOREIGN KEY ("payOrderId") REFERENCES "Order"("kucoinOrderId") ON DELETE SET NULL ON UPDATE CASCADE;
