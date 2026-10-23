-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "user_account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "locked_reason" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_user_email_not_empty" CHECK (length(trim("email")) > 0),
    CONSTRAINT "check_user_full_name_length" CHECK (length(trim("full_name")) >= 1 AND length("full_name") <= 120),
    CONSTRAINT "check_user_status" CHECK ("status" IN ('ACTIVE', 'LOCKED')),
    CONSTRAINT "check_user_version_positive" CHECK ("version" >= 0)
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id", "role"),
    CONSTRAINT "check_user_role" CHECK ("role" IN ('CANDIDATE', 'RECRUITER', 'INTERVIEWER', 'ADMIN'))
);

-- CreateTable
CREATE TABLE "auth_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "csrf_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "invalidated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_token_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_auth_token_purpose" CHECK ("purpose" IN ('VERIFY_EMAIL', 'RESET_PASSWORD'))
);

-- CreateTable
CREATE TABLE "company" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "tax_code" VARCHAR(50) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "website" VARCHAR(255),
    "description" TEXT,
    "approval_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "created_by" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_company_approval_status" CHECK ("approval_status" IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    CONSTRAINT "check_company_version_positive" CHECK ("version" >= 0)
);

-- CreateTable
CREATE TABLE "company_membership" (
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "permissions" TEXT[] NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_membership_pkey" PRIMARY KEY ("company_id", "user_id"),
    CONSTRAINT "check_membership_role" CHECK ("role" IN ('OWNER', 'RECRUITER', 'INTERVIEWER')),
    CONSTRAINT "check_membership_version_positive" CHECK ("version" >= 0)
);

-- CreateTable
CREATE TABLE "job_post" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" VARCHAR(150),
    "description" TEXT,
    "location" VARCHAR(255),
    "headcount" INTEGER,
    "job_type" VARCHAR(50),
    "workplace_mode" VARCHAR(50),
    "salary_min" DECIMAL(15,2),
    "salary_max" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "deadline" TIMESTAMPTZ(6),
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "close_reason" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_post_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_job_status" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
    CONSTRAINT "check_job_type" CHECK ("job_type" IS NULL OR "job_type" IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')),
    CONSTRAINT "check_job_workplace_mode" CHECK ("workplace_mode" IS NULL OR "workplace_mode" IN ('ON_SITE', 'HYBRID', 'REMOTE')),
    CONSTRAINT "check_job_headcount" CHECK ("headcount" IS NULL OR ("headcount" >= 1 AND "headcount" <= 100)),
    CONSTRAINT "check_job_salary" CHECK (
        ("salary_min" IS NULL AND "salary_max" IS NULL AND "currency" IS NULL) OR
        ("salary_min" IS NOT NULL AND "salary_max" IS NOT NULL AND "currency" IS NOT NULL AND "salary_min" >= 0 AND "salary_min" <= "salary_max" AND "currency" IN ('VND', 'USD'))
    ),
    CONSTRAINT "check_job_published_complete" CHECK (
        "status" != 'PUBLISHED' OR (
            "title" IS NOT NULL AND
            "description" IS NOT NULL AND
            "location" IS NOT NULL AND
            "headcount" IS NOT NULL AND
            "job_type" IS NOT NULL AND
            "workplace_mode" IS NOT NULL AND
            "deadline" IS NOT NULL AND
            "published_at" IS NOT NULL
        )
    ),
    CONSTRAINT "check_job_version_positive" CHECK ("version" >= 0)
);

-- CreateTable
CREATE TABLE "skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skill" (
    "job_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_skill_pkey" PRIMARY KEY ("job_id", "skill_id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");
CREATE UNIQUE INDEX "auth_session_token_hash_key" ON "auth_session"("token_hash");
CREATE INDEX "auth_session_user_id_revoked_at_expires_at_idx" ON "auth_session"("user_id", "revoked_at", "expires_at");
CREATE UNIQUE INDEX "auth_token_token_hash_key" ON "auth_token"("token_hash");
CREATE INDEX "auth_token_user_id_purpose_consumed_at_invalidated_at_expires_at_idx" ON "auth_token"("user_id", "purpose", "consumed_at", "invalidated_at", "expires_at");
CREATE UNIQUE INDEX "company_tax_code_key" ON "company"("tax_code");
CREATE INDEX "company_membership_user_id_active_idx" ON "company_membership"("user_id", "active");
CREATE INDEX "job_post_company_id_status_idx" ON "job_post"("company_id", "status");
CREATE INDEX "job_post_status_deadline_idx" ON "job_post"("status", "deadline");
CREATE UNIQUE INDEX "skill_name_key" ON "skill"("name");

-- AddForeignKeys
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auth_token" ADD CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company" ADD CONSTRAINT "company_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company_membership" ADD CONSTRAINT "company_membership_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company_membership" ADD CONSTRAINT "company_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_post" ADD CONSTRAINT "job_post_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_post" ADD CONSTRAINT "job_post_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_skill" ADD CONSTRAINT "job_skill_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_skill" ADD CONSTRAINT "job_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
