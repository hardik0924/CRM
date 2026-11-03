-- Campaigns were missing the fields the CRM page already used. Additive only.
ALTER TABLE `campaigns`
  ADD COLUMN `campaign_name` VARCHAR(191) NULL,
  ADD COLUMN `campaign_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `campaign_updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ADD COLUMN `campaign_deleted_at` DATETIME(3) NULL;

CREATE INDEX `campaigns_campaign_deleted_at_idx` ON `campaigns`(`campaign_deleted_at`);
