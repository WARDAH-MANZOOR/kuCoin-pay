/*
  Warnings:

  - Made the column `source` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OnchainOrder" ADD COLUMN     "assetUniqueId" TEXT,
ADD COLUMN     "paymentCurrency" TEXT,
ADD COLUMN     "paymentOrderType" TEXT,
ADD COLUMN     "paymentStatus" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "canRefundAmount" DOUBLE PRECISION,
ADD COLUMN     "cancelUrl" TEXT,
ADD COLUMN     "errorReason" TEXT,
ADD COLUMN     "goods" JSONB,
ADD COLUMN     "orderType" TEXT NOT NULL DEFAULT 'TRADE',
ADD COLUMN     "payRegion" TEXT,
ADD COLUMN     "payTime" BIGINT,
ADD COLUMN     "payerDetail" TEXT,
ADD COLUMN     "payerUserId" TEXT,
ADD COLUMN     "qrcode" TEXT,
ADD COLUMN     "refundCurrency" TEXT,
ADD COLUMN     "retrieveKycStatus" BOOLEAN,
ADD COLUMN     "returnUrl" TEXT,
ALTER COLUMN "source" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "processingFee" DOUBLE PRECISION,
ADD COLUMN     "totalPaidAmount" DOUBLE PRECISION,
ADD COLUMN     "totalPayoutFee" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PayoutDetail" ADD COLUMN     "payoutFee" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "assetUniqueId" TEXT,
ADD COLUMN     "chain" TEXT,
ADD COLUMN     "feeAmount" DOUBLE PRECISION,
ADD COLUMN     "payID" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "refundCurrency" TEXT,
ADD COLUMN     "refundFinishTime" BIGINT,
ADD COLUMN     "remainingRefundAmount" DOUBLE PRECISION,
ADD COLUMN     "remainingRefundCurrency" TEXT;
