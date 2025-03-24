-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
    "employmentStatus" TEXT NOT NULL,
    "dateOfEmployment" TIMESTAMP(3) NOT NULL,
    "assignedVehicle" TEXT,
    "vehicleLicensePlate" TEXT,
    "address" TEXT NOT NULL,
    "nextOfKinName" TEXT NOT NULL,
    "nextOfKinContact" TEXT NOT NULL,
    "medicalFitnessStatus" TEXT NOT NULL,
    "lastTrainingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Driver_driverId_idx" ON "Driver"("driverId");

-- CreateIndex
CREATE INDEX "Driver_fullName_idx" ON "Driver"("fullName");
