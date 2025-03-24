-- CreateTable
CREATE TABLE "FleetFueling" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "fuelingDate" TIMESTAMP(3) NOT NULL,
    "litersPurchased" DOUBLE PRECISION NOT NULL,
    "totalFuelCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FleetFueling_pkey" PRIMARY KEY ("id")
);
