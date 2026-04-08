ALTER TABLE clients
  ADD COLUMN currentSituationId INT NULL AFTER initialSituationId,
  ADD CONSTRAINT fk_clients_current_situation FOREIGN KEY (currentSituationId) REFERENCES lookups(id) ON DELETE SET NULL;
