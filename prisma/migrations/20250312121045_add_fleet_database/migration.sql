-- CreateTable
CREATE TABLE "FleetDatabase" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "makeModel" TEXT NOT NULL,
    "yearOfManufacture" INTEGER NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "engineNumber" TEXT NOT NULL,
    "assignedDriver" TEXT NOT NULL,
    "currentLocation" TEXT,
    "dateOfPurchase" TIMESTAMP(3) NOT NULL,
    "insuranceStatus" TEXT NOT NULL,
    "nextServiceDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FleetDatabase_pkey" PRIMARY KEY ("id")
);
