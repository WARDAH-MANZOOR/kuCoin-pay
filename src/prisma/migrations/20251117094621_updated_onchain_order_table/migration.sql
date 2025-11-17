-- AlterTable
ALTER TABLE "OnchainOrder" ADD COLUMN     "goods" JSONB,
ADD COLUMN     "orderType" TEXT,
ADD COLUMN     "paymentAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentChain" TEXT,
ADD COLUMN     "remainingRefundAmount" DOUBLE PRECISION,
ADD COLUMN     "remainingRefundCurrency" TEXT,
ALTER COLUMN "fiatCurrency" DROP NOT NULL,
ALTER COLUMN "fiatAmount" DROP NOT NULL,
ALTER COLUMN "cryptoAmount" DROP NOT NULL,
ALTER COLUMN "expireTime" SET DATA TYPE BIGINT,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;
