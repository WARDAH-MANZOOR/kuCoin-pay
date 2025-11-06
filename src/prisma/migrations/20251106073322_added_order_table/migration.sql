-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "orderAmount" DOUBLE PRECISION NOT NULL,
    "orderCurrency" TEXT NOT NULL,
    "reference" TEXT,
    "subMerchantId" TEXT,
    "source" TEXT,
    "expireTime" INTEGER,
    "kucoinOrderId" TEXT,
    "qrcodeUrl" TEXT,
    "appPayUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_requestId_key" ON "Order"("requestId");
