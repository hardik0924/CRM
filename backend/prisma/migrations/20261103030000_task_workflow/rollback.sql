-- Rollback for 20261103030000_task_workflow.
-- Drops only the additive task-workflow objects; existing task rows stay.

DROP TABLE IF EXISTS `task_updates`;

ALTER TABLE `tasks`
  DROP FOREIGN KEY `tasks_task_assigned_by_fk_fkey`;

DROP INDEX `tasks_task_user_fk_task_status_idx` ON `tasks`;
DROP INDEX `tasks_task_status_idx` ON `tasks`;

ALTER TABLE `tasks`
  DROP COLUMN `task_completed_at`,
  DROP COLUMN `task_start_date`,
  DROP COLUMN `task_progress`,
  DROP COLUMN `task_status`,
  DROP COLUMN `task_assigned_by_fk`;
