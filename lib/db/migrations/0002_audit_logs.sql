CREATE TABLE IF NOT EXISTS audit_logs (
 id bigserial PRIMARY KEY,
 actor_id integer,
 actor_role text,
 action text NOT NULL,
 entity_type text NOT NULL,
 entity_id text,
 method text NOT NULL,
 path text NOT NULL,
 status_code integer NOT NULL,
 ip_address text,
 request_id text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
