-- CreateTable
CREATE TABLE "ssadminJanitorialSupply" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "recipient" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ssadminJanitorialSupply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ssadminJanitorialSupply_itemId_key" ON "ssadminJanitorialSupply"("itemId");

-- CreateIndex
CREATE INDEX "ssadminJanitorialSupply_itemId_idx" ON "ssadminJanitorialSupply"("itemId");

-- CreateIndex
CREATE INDEX "ssadminJanitorialSupply_itemName_idx" ON "ssadminJanitorialSupply"("itemName");
