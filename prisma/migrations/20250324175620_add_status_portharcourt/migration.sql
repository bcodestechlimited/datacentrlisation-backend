-- CreateTable
CREATE TABLE "PortHarcourtFinancialTransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "customerVendorName" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "invoiceReceiptNumber" TEXT,
    "transactionStatus" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PortHarcourtFinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortHarcourtFinancialTransaction_transactionId_idx" ON "PortHarcourtFinancialTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "PortHarcourtFinancialTransaction_transactionDate_idx" ON "PortHarcourtFinancialTransaction"("transactionDate");
