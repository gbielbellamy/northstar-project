-- CreateEnum
CREATE TYPE "Area" AS ENUM ('Project', 'Learning', 'Algorithms', 'Job Search', 'Networking', 'Contributions', 'Interview Prep', 'Portfolio', 'Review');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Not started', 'In progress', 'Blocked', 'Done');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "DayKey" AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

-- CreateEnum
CREATE TYPE "ExceptionKind" AS ENUM ('Networking event', 'Interview', 'Technical blocker', 'Personal', 'Sick', 'Holiday');

-- CreateEnum
CREATE TYPE "OssStage" AS ENUM ('Shortlisted', 'Running locally', 'Issue claimed', 'PR open', 'Changes requested', 'Merged', 'Closed');

-- CreateEnum
CREATE TYPE "OssKind" AS ENUM ('Docs', 'Tests', 'Bug fix', 'Feature', 'Triage');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('Foundations', 'Styling', 'Frontend framework', 'State management', 'Backend', 'Data', 'Testing', 'Delivery', 'Hosting', 'Tooling', 'AI-assisted work', 'Career craft', 'Weekend & extras');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "RoadmapWeek" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT '',
    "projectDirection" TEXT NOT NULL DEFAULT '',
    "definitionOfDone" TEXT NOT NULL DEFAULT '',
    "status" "Status" NOT NULL DEFAULT 'Not started',
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RoadmapWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "area" "Area" NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "detail" TEXT NOT NULL DEFAULT '',
    "definitionOfDone" TEXT NOT NULL DEFAULT '',
    "status" "Status" NOT NULL DEFAULT 'Not started',
    "priority" "Priority" NOT NULL DEFAULT 'Medium',
    "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidenceUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" "DayKey" NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "area" "Area",
    "label" TEXT NOT NULL DEFAULT '',
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "sessionDone" TEXT,
    "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromWeek" INTEGER,
    "toWeek" INTEGER,

    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "currentLevel" TEXT NOT NULL DEFAULT '',
    "target" TEXT NOT NULL DEFAULT '',
    "priority" "Priority" NOT NULL DEFAULT 'Medium',
    "evidence" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL DEFAULT '',
    "why" TEXT NOT NULL DEFAULT '',
    "miniProject" TEXT NOT NULL DEFAULT '',
    "miniProjectDod" TEXT NOT NULL DEFAULT '',
    "category" "SkillCategory" NOT NULL DEFAULT 'Foundations',
    "badge" TEXT NOT NULL DEFAULT '',
    "colour" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "resources" JSONB NOT NULL DEFAULT '[]',
    "sessions" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OssContribution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "kind" "OssKind" NOT NULL DEFAULT 'Docs',
    "stage" "OssStage" NOT NULL DEFAULT 'Shortlisted',
    "issueUrl" TEXT NOT NULL DEFAULT '',
    "prUrl" TEXT NOT NULL DEFAULT '',
    "why" TEXT NOT NULL DEFAULT '',
    "reviewLesson" TEXT NOT NULL DEFAULT '',
    "dateStarted" TEXT NOT NULL DEFAULT '',
    "dateMerged" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OssContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayException" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "ExceptionKind" NOT NULL DEFAULT 'Personal',
    "note" TEXT NOT NULL DEFAULT '',
    "hoursOwed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recoverOn" TEXT NOT NULL DEFAULT '',
    "recovered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DayException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deferral" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "area" "Area" NOT NULL,

    CONSTRAINT "Deferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "shipped" TEXT NOT NULL DEFAULT '',
    "evidenceUrls" TEXT NOT NULL DEFAULT '',
    "applicationsSent" INTEGER NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "callsMeetups" INTEGER NOT NULL DEFAULT 0,
    "interviewPrepDone" BOOLEAN NOT NULL DEFAULT false,
    "technicalLesson" TEXT NOT NULL DEFAULT '',
    "mainBlocker" TEXT NOT NULL DEFAULT '',
    "changeNextWeek" TEXT NOT NULL DEFAULT '',
    "energyFocus" INTEGER,
    "weekComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLogEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoadmapWeek_userId_idx" ON "RoadmapWeek"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapWeek_userId_week_key" ON "RoadmapWeek"("userId", "week");

-- CreateIndex
CREATE INDEX "WeeklyGoal_userId_idx" ON "WeeklyGoal"("userId");

-- CreateIndex
CREATE INDEX "WeeklyGoal_userId_week_idx" ON "WeeklyGoal"("userId", "week");

-- CreateIndex
CREATE INDEX "ScheduleBlock_userId_idx" ON "ScheduleBlock"("userId");

-- CreateIndex
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");

-- CreateIndex
CREATE INDEX "MessageTemplate_userId_idx" ON "MessageTemplate"("userId");

-- CreateIndex
CREATE INDEX "OssContribution_userId_idx" ON "OssContribution"("userId");

-- CreateIndex
CREATE INDEX "DayException_userId_idx" ON "DayException"("userId");

-- CreateIndex
CREATE INDEX "Deferral_userId_idx" ON "Deferral"("userId");

-- CreateIndex
CREATE INDEX "WeeklyReview_userId_idx" ON "WeeklyReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_userId_week_key" ON "WeeklyReview"("userId", "week");

-- CreateIndex
CREATE INDEX "DailyLogEntry_userId_idx" ON "DailyLogEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLogEntry_userId_date_blockId_key" ON "DailyLogEntry"("userId", "date", "blockId");

-- AddForeignKey
ALTER TABLE "RoadmapWeek" ADD CONSTRAINT "RoadmapWeek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OssContribution" ADD CONSTRAINT "OssContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayException" ADD CONSTRAINT "DayException_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deferral" ADD CONSTRAINT "Deferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLogEntry" ADD CONSTRAINT "DailyLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
