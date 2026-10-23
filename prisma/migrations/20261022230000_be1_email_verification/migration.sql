ALTER TABLE "user_account" ADD COLUMN "email_verified_at" TIMESTAMPTZ(6);

-- Preserve only successful verification evidence; invalidation is not verification.
UPDATE "user_account" AS account
SET "email_verified_at" = verified."verified_at"
FROM (
  SELECT "user_id", MIN("consumed_at") AS "verified_at"
  FROM "auth_token"
  WHERE "purpose" = 'VERIFY_EMAIL'
    AND "consumed_at" IS NOT NULL
    AND "invalidated_at" IS NULL
  GROUP BY "user_id"
) AS verified
WHERE account."id" = verified."user_id";
