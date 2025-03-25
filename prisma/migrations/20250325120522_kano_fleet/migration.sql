-- CreateTable
CREATE TABLE "KanoFleet" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleTypeModel" TEXT NOT NULL,
    "licensePlateNumber" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "lastMaintenanceDate" TIMESTAMP(3) NOT NULL,
    "assignedDriver" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KanoFleet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KanoFleet_vehicleId_key" ON "KanoFleet"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "KanoFleet_licensePlateNumber_key" ON "KanoFleet"("licensePlateNumber");

-- CreateIndex
CREATE INDEX "KanoFleet_vehicleId_idx" ON "KanoFleet"("vehicleId");

-- CreateIndex
CREATE INDEX "KanoFleet_licensePlateNumber_idx" ON "KanoFleet"("licensePlateNumber");

-- CreateIndex
CREATE INDEX "KanoFleet_currentStatus_idx" ON "KanoFleet"("currentStatus");
