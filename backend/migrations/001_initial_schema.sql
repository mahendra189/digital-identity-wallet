-- 001_initial_schema.sql
-- Digital Identity Wallet Database Schema

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(16) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_accounts_username ON accounts(username);

CREATE TABLE IF NOT EXISTS credential_records (
    credential_id VARCHAR(128) PRIMARY KEY,
    roll_number VARCHAR(64) NOT NULL,
    status_list_credential VARCHAR(512) NOT NULL,
    status_list_index INTEGER NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_credential_records_roll_number ON credential_records(roll_number);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    target VARCHAR(128) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_at ON audit_logs(at);
