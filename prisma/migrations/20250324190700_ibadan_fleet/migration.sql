-- CreateTable
CREATE TABLE "IbadanFleet" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleTypeModel" TEXT NOT NULL,
    "licensePlateNumber" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "vehicleStatus" TEXT NOT NULL,
    "assignedDriver" TEXT,
    "fuelConsumptionRate" TEXT NOT NULL,
    "lastServiceDate" TIMESTAMP(3) NOT NULL,
    "nextServiceDueDate" TIMESTAMP(3) NOT NULL,
    "insuranceExpiryDate" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER NOT NULL,
    "ownershipStatus" TEXT NOT NULL,
    "accidentRepairHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "IbadanFleet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IbadanFleet_vehicleId_idx" ON "IbadanFleet"("vehicleId");

-- CreateIndex
CREATE INDEX "IbadanFleet_licensePlateNumber_idx" ON "IbadanFleet"("licensePlateNumber");
