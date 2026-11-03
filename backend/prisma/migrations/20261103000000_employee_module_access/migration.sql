-- Employee module access: additive migration only.
ALTER TABLE `users`
  ADD COLUMN `user_module_access` VARCHAR(191) NULL;
