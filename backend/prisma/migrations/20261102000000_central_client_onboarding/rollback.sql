-- Rollback for 20261102000000_central_client_onboarding.
-- Removes only the additive integration structures. Business data is untouched.
-- Run manually in a controlled environment after taking a backup.

DROP TABLE IF EXISTS `integration_events`;
DROP TABLE IF EXISTS `invitations`;
DROP TABLE IF EXISTS `organization_app_entitlements`;

DROP INDEX `tenants_external_organization_id_key` ON `tenants`;
ALTER TABLE `tenants`
  DROP COLUMN `external_organization_id`,
  DROP COLUMN `tenant_sync_status`,
  DROP COLUMN `tenant_synced_at`;

-- WARNING: restoring NOT NULL on user_password fails if an invited user has not
-- set a password yet. Deactivate/remove those users first.
ALTER TABLE `users`
  DROP COLUMN `user_is_tenant_owner`,
  MODIFY COLUMN `user_password` VARCHAR(191) NOT NULL;
