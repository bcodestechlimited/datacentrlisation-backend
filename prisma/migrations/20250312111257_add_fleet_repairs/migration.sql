-- CreateTable
CREATE TABLE "FleetRepairs" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "repairDate" TIMESTAMP(3) NOT NULL,
    "workshopName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "partsReplaced" TEXT[],
    "repairCost" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FleetRepairs_pkey" PRIMARY KEY ("id")
);
