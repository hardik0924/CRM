-- Employee task workflow: additive only. Existing rows keep their data.

ALTER TABLE `tasks`
  ADD COLUMN `task_assigned_by_fk` VARCHAR(191) NULL,
  ADD COLUMN `task_status` ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED') NOT NULL DEFAULT 'TODO',
  ADD COLUMN `task_progress` INT NOT NULL DEFAULT 0,
  ADD COLUMN `task_start_date` DATETIME(3) NULL,
  ADD COLUMN `task_completed_at` DATETIME(3) NULL;

CREATE INDEX `tasks_task_status_idx` ON `tasks`(`task_status`);
CREATE INDEX `tasks_task_user_fk_task_status_idx` ON `tasks`(`task_user_fk`, `task_status`);

ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_task_assigned_by_fk_fkey`
  FOREIGN KEY (`task_assigned_by_fk`) REFERENCES `users`(`user_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `task_updates` (
  `task_update_id` VARCHAR(191) NOT NULL,
  `tenant_fk` VARCHAR(191) NOT NULL,
  `task_fk` VARCHAR(191) NOT NULL,
  `user_fk` VARCHAR(191) NULL,
  `previous_status` ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED') NULL,
  `new_status` ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED') NULL,
  `previous_progress` INT NULL,
  `new_progress` INT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `task_updates_task_fk_created_at_idx`(`task_fk`, `created_at`),
  INDEX `task_updates_tenant_fk_idx`(`tenant_fk`),
  INDEX `task_updates_user_fk_idx`(`user_fk`),
  PRIMARY KEY (`task_update_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `task_updates`
  ADD CONSTRAINT `task_updates_tenant_fk_fkey`
    FOREIGN KEY (`tenant_fk`) REFERENCES `tenants`(`tenant_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `task_updates_task_fk_fkey`
    FOREIGN KEY (`task_fk`) REFERENCES `tasks`(`task_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `task_updates_user_fk_fkey`
    FOREIGN KEY (`user_fk`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
