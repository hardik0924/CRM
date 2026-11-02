-- Centralized client onboarding: additive migration only.
-- No table or column is dropped and no business data is deleted.

-- 1. Organization identity / sync metadata
ALTER TABLE `tenants`
  ADD COLUMN `external_organization_id` VARCHAR(191) NULL,
  ADD COLUMN `tenant_sync_status` VARCHAR(32) NULL,
  ADD COLUMN `tenant_synced_at` DATETIME(3) NULL;

CREATE UNIQUE INDEX `tenants_external_organization_id_key`
  ON `tenants` (`external_organization_id`);

-- 2. Client super admin marker + nullable password until invitation accepted
ALTER TABLE `users`
  ADD COLUMN `user_is_tenant_owner` TINYINT(1) NOT NULL DEFAULT 0,
  MODIFY COLUMN `user_password` VARCHAR(191) NULL;

-- 3. CRM entitlement per organization
CREATE TABLE `organization_app_entitlements` (
  `entitlement_id` VARCHAR(191) NOT NULL,
  `tenant_fk` VARCHAR(191) NOT NULL,
  `app_code` VARCHAR(191) NOT NULL DEFAULT 'CRM',
  `entitlement_status` ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED', 'PENDING') NOT NULL DEFAULT 'PENDING',
  `external_subscription_ref` VARCHAR(191) NULL,
  `effective_start` DATETIME(3) NULL,
  `effective_end` DATETIME(3) NULL,
  `last_synced_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`entitlement_id`),
  UNIQUE INDEX `organization_app_entitlements_tenant_fk_app_code_key` (`tenant_fk`, `app_code`),
  INDEX `organization_app_entitlements_entitlement_status_idx` (`entitlement_status`),
  CONSTRAINT `organization_app_entitlements_tenant_fk_fkey`
    FOREIGN KEY (`tenant_fk`) REFERENCES `tenants` (`tenant_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Invitations (token hash only; raw token never stored)
CREATE TABLE `invitations` (
  `invitation_id` VARCHAR(191) NOT NULL,
  `tenant_fk` VARCHAR(191) NOT NULL,
  `invitation_email` VARCHAR(191) NOT NULL,
  `invitation_role` ENUM('USER', 'ADMIN', 'SUPER_ADMIN', 'SALES', 'DATA', 'PRODUCTION', 'SPONSORSHIP', 'OPERATION') NOT NULL DEFAULT 'ADMIN',
  `invitation_token_hash` VARCHAR(191) NOT NULL,
  `invitation_status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
  `invitation_expires_at` DATETIME(3) NOT NULL,
  `invitation_accepted_at` DATETIME(3) NULL,
  `invitation_source` VARCHAR(191) NULL,
  `invited_by` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`invitation_id`),
  UNIQUE INDEX `invitations_invitation_token_hash_key` (`invitation_token_hash`),
  INDEX `invitations_tenant_fk_invitation_email_invitation_status_idx` (`tenant_fk`, `invitation_email`, `invitation_status`),
  INDEX `invitations_invitation_status_invitation_expires_at_idx` (`invitation_status`, `invitation_expires_at`),
  CONSTRAINT `invitations_tenant_fk_fkey`
    FOREIGN KEY (`tenant_fk`) REFERENCES `tenants` (`tenant_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Integration audit trail (payload is metadata, not credentials)
CREATE TABLE `integration_events` (
  `event_id` VARCHAR(191) NOT NULL,
  `external_organization_id` VARCHAR(191) NULL,
  `event_type` VARCHAR(191) NOT NULL,
  `event_outcome` VARCHAR(191) NOT NULL,
  `event_message` TEXT NULL,
  `event_payload` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`event_id`),
  INDEX `integration_events_external_organization_id_idx` (`external_organization_id`),
  INDEX `integration_events_event_type_idx` (`event_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Backfill: keep every existing client working after migration.
INSERT INTO `organization_app_entitlements`
  (`entitlement_id`, `tenant_fk`, `app_code`, `entitlement_status`, `last_synced_at`, `created_at`, `updated_at`)
SELECT UUID(), t.`tenant_id`, 'CRM', 'ACTIVE', NOW(3), NOW(3), NOW(3)
FROM `tenants` t
LEFT JOIN `organization_app_entitlements` e
  ON e.`tenant_fk` = t.`tenant_id` AND e.`app_code` = 'CRM'
WHERE e.`entitlement_id` IS NULL;

-- 7. Backfill: one explicit client super admin per existing tenant.
UPDATE `users` u
JOIN (
  SELECT `tenant_fk`, MIN(`user_id`) AS owner_id
  FROM `users`
  WHERE `tenant_fk` IS NOT NULL AND `user_role` = 'ADMIN'
  GROUP BY `tenant_fk`
) owners ON owners.owner_id = u.`user_id`
SET u.`user_is_tenant_owner` = 1;
