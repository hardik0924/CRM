-- Contact detail can create tasks. Additive only.
ALTER TABLE `tasks`
  ADD COLUMN `task_contact_fk` VARCHAR(191) NULL;

CREATE INDEX `tasks_task_contact_fk_idx` ON `tasks`(`task_contact_fk`);

ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_task_contact_fk_fkey`
  FOREIGN KEY (`task_contact_fk`) REFERENCES `contacts`(`contact_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
