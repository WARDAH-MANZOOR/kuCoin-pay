-- CreateTable
CREATE TABLE "OnchainOrder" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "fiatAmount" DOUBLE PRECISION NOT NULL,
    "cryptoCurrency" TEXT NOT NULL,
    "cryptoAmount" DOUBLE PRECISION NOT NULL,
    "chain" TEXT NOT NULL,
    "notifyUrl" TEXT,
    "kucoinOrderId" TEXT,
    "walletAddress" TEXT,
    "precision" INTEGER,
    "expireTime" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnchainOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnchainOrder_requestId_key" ON "OnchainOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "OnchainOrder_kucoinOrderId_key" ON "OnchainOrder"("kucoinOrderId");
