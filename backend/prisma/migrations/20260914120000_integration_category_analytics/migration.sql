-- Give Search Console, and later analytics providers such as GA4, their own
-- integration category.
--
-- It was filed under ADS for want of a better value, so the Integrations page
-- listed it under "Ads platforms" with the subtitle "Ads platform", which is not
-- where anyone looks for Search Console.
--
-- Postgres allows ADD VALUE inside a transaction from version 12, but the new
-- value cannot be USED in the same transaction. Moving rows onto it therefore
-- lives in the next migration, which is applied separately.

ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'ANALYTICS';
