-- CreateTable
CREATE TABLE "ssadminBill" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "serviceProvider" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ssadminBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ssadminBill_billId_key" ON "ssadminBill"("billId");

-- CreateIndex
CREATE INDEX "ssadminBill_billId_idx" ON "ssadminBill"("billId");

-- CreateIndex
CREATE INDEX "ssadminBill_serviceProvider_idx" ON "ssadminBill"("serviceProvider");
