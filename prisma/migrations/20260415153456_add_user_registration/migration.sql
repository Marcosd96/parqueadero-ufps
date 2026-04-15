-- CreateTable
CREATE TABLE "UserRegistration" (
    "id" SERIAL NOT NULL,
    "userType" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "institutionalCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "carnetFilePath" TEXT NOT NULL,
    "ownershipFilePath" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRegistration_pkey" PRIMARY KEY ("id")
);
