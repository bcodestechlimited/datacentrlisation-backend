-- CreateTable
CREATE TABLE "Shared_Services_Admin_Vendor_StoreroomStock" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reorderLevel" INTEGER NOT NULL,
    "lastRestocked" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Shared_Services_Admin_Vendor_StoreroomStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shared_Services_Admin_Vendor_StoreroomStock_stockId_key" ON "Shared_Services_Admin_Vendor_StoreroomStock"("stockId");

-- CreateIndex
CREATE INDEX "Shared_Services_Admin_Vendor_StoreroomStock_stockId_idx" ON "Shared_Services_Admin_Vendor_StoreroomStock"("stockId");

-- CreateIndex
CREATE INDEX "Shared_Services_Admin_Vendor_StoreroomStock_itemName_idx" ON "Shared_Services_Admin_Vendor_StoreroomStock"("itemName");

-- CreateIndex
CREATE INDEX "Shared_Services_Admin_Vendor_StoreroomStock_category_idx" ON "Shared_Services_Admin_Vendor_StoreroomStock"("category");
