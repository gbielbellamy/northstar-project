-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Saved', 'Preparing', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn');

-- CreateEnum
CREATE TYPE "RoleFamily" AS ENUM ('Full-Stack SWE', 'Frontend SWE', 'Technical Support', 'Solutions Engineer', 'Implementation Engineer', 'QA Automation', 'Customer Engineer');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('Not contacted', 'Drafted', 'Sent', 'Connected', 'Replied', 'Meeting scheduled', 'Follow-up due', 'No response');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('Peer contact', 'Hiring influencer', 'Recruiter');

-- CreateEnum
CREATE TYPE "CompanyPriority" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('Researching', 'Applying', 'Applied', 'Interviewing', 'Rejected', 'Offer', 'Deprioritized');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "workMode" TEXT NOT NULL DEFAULT '',
    "priority" "CompanyPriority" NOT NULL DEFAULT 'B',
    "fitScore" INTEGER NOT NULL DEFAULT 70,
    "primaryRoles" TEXT NOT NULL DEFAULT '',
    "secondaryRoles" TEXT NOT NULL DEFAULT '',
    "whyItFits" TEXT NOT NULL DEFAULT '',
    "stack" TEXT NOT NULL DEFAULT '',
    "careersUrl" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "status" "CompanyStatus" NOT NULL DEFAULT 'Researching',
    "lastReviewed" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "company" TEXT NOT NULL,
    "person" TEXT NOT NULL DEFAULT '',
    "targetProfile" TEXT NOT NULL DEFAULT '',
    "contactType" "ContactType" NOT NULL DEFAULT 'Peer contact',
    "status" "ContactStatus" NOT NULL DEFAULT 'Not contacted',
    "searchUrl" TEXT NOT NULL DEFAULT '',
    "companyUrl" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "angle" TEXT NOT NULL DEFAULT '',
    "week" INTEGER,
    "lastContact" TEXT NOT NULL DEFAULT '',
    "dateSent" TEXT NOT NULL DEFAULT '',
    "followup" TEXT NOT NULL DEFAULT '',
    "meeting" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "family" "RoleFamily",
    "status" "ApplicationStatus" NOT NULL DEFAULT 'Saved',
    "url" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "salary" TEXT NOT NULL DEFAULT '',
    "week" INTEGER,
    "dateFound" TEXT NOT NULL DEFAULT '',
    "deadline" TEXT NOT NULL DEFAULT '',
    "dateApplied" TEXT NOT NULL DEFAULT '',
    "followup" TEXT NOT NULL DEFAULT '',
    "interviewStage" TEXT NOT NULL DEFAULT '',
    "resumeVersion" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Application_userId_followup_idx" ON "Application"("userId", "followup");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
