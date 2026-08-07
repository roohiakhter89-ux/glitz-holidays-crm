-- Drop VENDOR, AGENT, GUEST from Role. These were user-account roles for
-- external parties (hotels, B2B agents, prospective clients), but this ERP is
-- staff-only — external parties are DATA (Vendor, Partner, Lead), not logins.
-- Letting an outsider hold a session token is what the supplier-protection
-- story is built to prevent.
--
-- Postgres does not support DROP TYPE ... IF EXISTS on individual enum values
-- in older versions, and even where it does, drop is blocked if any row still
-- uses the value. So we:
--   1. Refuse to run if any user still has one of the doomed roles. A silent
--      re-map to SALES_EXEC would be worse than a failed migration — the
--      person doing the deploy would never know an outsider had access.
--   2. Rebuild the enum without the three values, cast the column across.
--
-- If the guard fires, decide by hand: delete the user, or promote them to a
-- staff role, then re-run.

DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM "User"
  WHERE role::text IN ('VENDOR', 'AGENT', 'GUEST');

  IF bad_count > 0 THEN
    RAISE EXCEPTION
      'Cannot drop VENDOR/AGENT/GUEST from Role: % user(s) still have one of these roles. Reassign or delete them, then re-run.',
      bad_count;
  END IF;
END $$;

-- Rebuild the enum. The rename dance is the standard Postgres pattern for
-- dropping an enum value.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'OWNER',
  'SALES_MANAGER',
  'SALES_EXEC',
  'ACCOUNTS',
  'MARKETING',
  'OPERATIONS'
);

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role"),
  ALTER COLUMN "role" SET DEFAULT 'SALES_EXEC';

DROP TYPE "Role_old";
