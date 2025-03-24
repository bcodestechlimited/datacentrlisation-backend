-- CreateTable
CREATE TABLE "ClientInfo" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutsourcedTraining" (
    "id" TEXT NOT NULL,
    "trainingTitle" TEXT NOT NULL,
    "trainingProvider" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "trainingCategory" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "trainingLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OutsourcedTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "companyName" TEXT,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingContent" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "modulesCovered" TEXT[],
    "facilitatorNames" TEXT[],
    "modeOfDelivery" TEXT NOT NULL,
    "materialsProvided" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TrainingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "feedbackScore" INTEGER NOT NULL,
    "keyLearnings" TEXT[],
    "challenges" TEXT[],
    "suggestions" TEXT[],
    "certificationProvided" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cost" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "trainingFee" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "modeOfPayment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalTraining" (
    "id" TEXT NOT NULL,
    "trainingTitle" TEXT NOT NULL,
    "trainingObjective" TEXT NOT NULL,
    "trainingCategory" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "trainingMode" TEXT NOT NULL,
    "trainingLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InternalTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalParticipant" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "attendanceStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InternalParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalTrainingContent" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "modulesCovered" TEXT[],
    "facilitatorNames" TEXT[],
    "materialsProvided" TEXT[],
    "methodology" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InternalTrainingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalEvaluation" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "preTrainingScore" DOUBLE PRECISION,
    "postTrainingScore" DOUBLE PRECISION,
    "feedbackScore" INTEGER NOT NULL,
    "keyLearnings" TEXT[],
    "challenges" TEXT[],
    "suggestions" TEXT[],
    "certificationProvided" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InternalEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalCost" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "trainingCost" DOUBLE PRECISION,
    "budgetAllocation" DOUBLE PRECISION,
    "approvalStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InternalCost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "OutsourcedTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingContent" ADD CONSTRAINT "TrainingContent_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "OutsourcedTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "OutsourcedTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "OutsourcedTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalParticipant" ADD CONSTRAINT "InternalParticipant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InternalTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTrainingContent" ADD CONSTRAINT "InternalTrainingContent_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InternalTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalEvaluation" ADD CONSTRAINT "InternalEvaluation_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InternalTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalCost" ADD CONSTRAINT "InternalCost_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "InternalTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
