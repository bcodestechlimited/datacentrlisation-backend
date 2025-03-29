/*
  Warnings:

  - You are about to drop the `SharedServicesAdminVendorStoreroomStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "SharedServicesAdminVendorStoreroomStock";

-- CreateTable
CREATE TABLE "ssadminFacility" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "assignedVendor" TEXT NOT NULL,
    "maintenanceStatus" TEXT NOT NULL,
    "lastMaintenance" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ssadminFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ssadminFacility_facilityId_key" ON "ssadminFacility"("facilityId");

-- CreateIndex
CREATE INDEX "ssadminFacility_facilityId_idx" ON "ssadminFacility"("facilityId");

-- CreateIndex
CREATE INDEX "ssadminFacility_facilityName_idx" ON "ssadminFacility"("facilityName");
