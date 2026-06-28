-- Realtime conversion notes for MySQL
-- Postgres uses publications and logical replication for Supabase realtime.
-- MySQL does not provide equivalent publications; for realtime features use an application-level
-- websocket (Socket.IO) or a change data capture tool (e.g., Debezium) connected to the MySQL binlog.

-- Recommended: keep the frontend realtime client pointed to the existing Supabase realtime server
-- or implement a Node service that emits changes via sockets when DB updates occur.

-- The original SQL below was for Postgres publications and grants; we add a small helper table
-- to track subscription metadata for administrative use.

CREATE TABLE IF NOT EXISTS realtime_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
