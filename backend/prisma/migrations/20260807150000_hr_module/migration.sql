-- HR module: Employee, SalarySlip, Interview. Statements are plain (no DO blocks).
-- The applier script tolerates "already exists" errors so this stays re-runnable
-- even though the _prisma_migrations tracking table is currently absent.

CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT');

CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'NOTICE', 'EXITED');

CREATE TYPE "InterviewOutcome" AS ENUM ('PENDING', 'SELECTED', 'ON_HOLD', 'REJECTED');

CREATE TABLE "Employee" (
  "id"                       TEXT PRIMARY KEY,
  "code"                     TEXT NOT NULL,
  "fullName"                 TEXT NOT NULL,
  "fatherName"               TEXT,
  "photoUrl"                 TEXT,
  "bloodGroup"               TEXT,
  "dob"                      TIMESTAMP(3),
  "gender"                   TEXT,
  "nationality"              TEXT DEFAULT 'Indian',
  "phone"                    TEXT NOT NULL,
  "altPhone"                 TEXT,
  "email"                    TEXT,
  "addressLine"              TEXT,
  "city"                     TEXT,
  "state"                    TEXT,
  "pincode"                  TEXT,
  "emergencyContactName"     TEXT,
  "emergencyContactPhone"    TEXT,
  "emergencyContactRelation" TEXT,
  "aadhaar"                  TEXT,
  "pan"                      TEXT,
  "designation"              TEXT NOT NULL,
  "department"               TEXT,
  "employmentType"           "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "status"                   "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedOn"                 TIMESTAMP(3) NOT NULL,
  "confirmedOn"              TIMESTAMP(3),
  "exitedOn"                 TIMESTAMP(3),
  "reportsToId"              TEXT,
  "userId"                   TEXT,
  "ctcMonthly"               INTEGER,
  "basicMonthly"             INTEGER,
  "hraMonthly"               INTEGER,
  "allowMonthly"             INTEGER,
  "pfMonthly"                INTEGER,
  "esiMonthly"               INTEGER,
  "taxMonthly"               INTEGER,
  "otherDedMonthly"          INTEGER,
  "bankName"                 TEXT,
  "accountNumber"            TEXT,
  "ifsc"                     TEXT,
  "notes"                    TEXT,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Employee_code_key"        ON "Employee"("code");

CREATE UNIQUE INDEX "Employee_userId_key"      ON "Employee"("userId");

CREATE INDEX "Employee_status_idx"             ON "Employee"("status");

CREATE INDEX "Employee_department_idx"         ON "Employee"("department");

CREATE INDEX "Employee_reportsToId_idx"        ON "Employee"("reportsToId");

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SalarySlip" (
  "id"          TEXT PRIMARY KEY,
  "employeeId"  TEXT NOT NULL,
  "periodMonth" TIMESTAMP(3) NOT NULL,
  "daysWorked"  INTEGER,
  "daysInMonth" INTEGER,
  "lop"         INTEGER,
  "basic"       INTEGER NOT NULL DEFAULT 0,
  "hra"         INTEGER NOT NULL DEFAULT 0,
  "allowances"  INTEGER NOT NULL DEFAULT 0,
  "bonus"       INTEGER NOT NULL DEFAULT 0,
  "arrears"     INTEGER NOT NULL DEFAULT 0,
  "pf"          INTEGER NOT NULL DEFAULT 0,
  "esi"         INTEGER NOT NULL DEFAULT 0,
  "tax"         INTEGER NOT NULL DEFAULT 0,
  "otherDed"    INTEGER NOT NULL DEFAULT 0,
  "grossPay"    INTEGER NOT NULL DEFAULT 0,
  "totalDed"    INTEGER NOT NULL DEFAULT 0,
  "netPay"      INTEGER NOT NULL DEFAULT 0,
  "paidOn"      TIMESTAMP(3),
  "reference"   TEXT,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);

CREATE INDEX "SalarySlip_periodMonth_idx"                     ON "SalarySlip"("periodMonth");

CREATE UNIQUE INDEX "SalarySlip_employeeId_periodMonth_key"   ON "SalarySlip"("employeeId", "periodMonth");

ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Interview" (
  "id"              TEXT PRIMARY KEY,
  "candidateName"   TEXT NOT NULL,
  "candidatePhone"  TEXT NOT NULL,
  "candidateEmail"  TEXT,
  "role"            TEXT NOT NULL,
  "scheduledAt"     TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER DEFAULT 45,
  "interviewerId"   TEXT,
  "interviewerName" TEXT,
  "questionnaire"   JSONB DEFAULT '[]',
  "overallRating"   INTEGER,
  "strengths"       TEXT,
  "concerns"        TEXT,
  "outcome"         "InterviewOutcome" NOT NULL DEFAULT 'PENDING',
  "outcomeNote"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Interview_outcome_idx"     ON "Interview"("outcome");

CREATE INDEX "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
