-- Restores the global unique key. Fails if two tenants now use the same name:
-- delete the duplicates first, or keep the per-tenant key.

ALTER TABLE `industries` DROP INDEX `industries_tenant_fk_industry_name_key`;
ALTER TABLE `industries` ADD UNIQUE INDEX `industries_industry_name_key` (`industry_name`);
