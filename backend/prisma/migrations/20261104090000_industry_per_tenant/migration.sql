-- Industry names become unique per tenant instead of globally.
-- Existing rows already satisfy this (the old key was stricter), so no backfill.

ALTER TABLE `industries` DROP INDEX `industries_industry_name_key`;
ALTER TABLE `industries`
  ADD UNIQUE INDEX `industries_tenant_fk_industry_name_key` (`tenant_fk`, `industry_name`);
