/*
  Warnings:

  - You are about to drop the `Shared_Services_Admin_Vendor_StoreroomStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Shared_Services_Admin_Vendor_StoreroomStock";

-- CreateTable
CREATE TABLE "SharedServicesAdminVendorStoreroomStock" (
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

    CONSTRAINT "SharedServicesAdminVendorStoreroomStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ssadminstoreroom" (
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

    CONSTRAINT "ssadminstoreroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedServicesAdminVendorStoreroomStock_stockId_key" ON "SharedServicesAdminVendorStoreroomStock"("stockId");

-- CreateIndex
CREATE INDEX "SharedServicesAdminVendorStoreroomStock_stockId_idx" ON "SharedServicesAdminVendorStoreroomStock"("stockId");

-- CreateIndex
CREATE INDEX "SharedServicesAdminVendorStoreroomStock_itemName_idx" ON "SharedServicesAdminVendorStoreroomStock"("itemName");

-- CreateIndex
CREATE INDEX "SharedServicesAdminVendorStoreroomStock_category_idx" ON "SharedServicesAdminVendorStoreroomStock"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ssadminstoreroom_stockId_key" ON "ssadminstoreroom"("stockId");

-- CreateIndex
CREATE INDEX "ssadminstoreroom_stockId_idx" ON "ssadminstoreroom"("stockId");

-- CreateIndex
CREATE INDEX "ssadminstoreroom_itemName_idx" ON "ssadminstoreroom"("itemName");

-- CreateIndex
CREATE INDEX "ssadminstoreroom_category_idx" ON "ssadminstoreroom"("category");
