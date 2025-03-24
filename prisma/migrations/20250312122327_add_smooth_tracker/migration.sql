-- CreateTable
CREATE TABLE "SmoothTracker" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "trackingDeviceId" TEXT NOT NULL,
    "distanceCovered" DOUBLE PRECISION NOT NULL,
    "fuelConsumption" DOUBLE PRECISION NOT NULL,
    "alerts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SmoothTracker_pkey" PRIMARY KEY ("id")
);
