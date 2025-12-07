-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    created_at BIGINT NOT NULL
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    price_usd DECIMAL(20, 8) NOT NULL,
    decimals INTEGER NOT NULL
);

-- Protocol Parameters table
CREATE TABLE IF NOT EXISTS protocol_params (
    id SERIAL PRIMARY KEY,
    ltv_ratio DECIMAL(5, 4) NOT NULL,
    liquidation_threshold DECIMAL(5, 4) NOT NULL,
    borrow_apy DECIMAL(5, 4) NOT NULL,
    supply_apy DECIMAL(5, 4) NOT NULL,
    tick_seconds INTEGER NOT NULL
);

-- Liquidity Pool table
CREATE TABLE IF NOT EXISTS liquidity_pool (
    id SERIAL PRIMARY KEY,
    total_supplied DECIMAL(20, 8) DEFAULT 0,
    total_borrowed DECIMAL(20, 8) DEFAULT 0,
    available_liquidity DECIMAL(20, 8) DEFAULT 0,
    supply_apy DECIMAL(5, 4) NOT NULL
);

-- Deposits table (Collateral)
CREATE TABLE IF NOT EXISTS deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    asset_id INTEGER REFERENCES assets(id),
    amount DECIMAL(20, 8) NOT NULL,
    created_at BIGINT NOT NULL
);

-- Supplies table (Liquidity)
CREATE TABLE IF NOT EXISTS supplies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(20, 8) NOT NULL,
    interest_earned DECIMAL(20, 8) DEFAULT 0,
    last_accrual_ts BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    asset_id INTEGER REFERENCES assets(id),
    principal DECIMAL(20, 8) NOT NULL,
    interest_accrued DECIMAL(20, 8) DEFAULT 0,
    last_accrual_ts BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'active', 'repaid', 'liquidated'
    created_at BIGINT NOT NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Initial Data Seeding
INSERT INTO assets (symbol, price_usd, decimals) VALUES 
    ('QX', 10.0, 8),
    ('QUSD', 1.0, 8)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO protocol_params (id, ltv_ratio, liquidation_threshold, borrow_apy, supply_apy, tick_seconds) 
VALUES (1, 0.75, 0.85, 0.10, 0.08, 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO liquidity_pool (id, total_supplied, total_borrowed, available_liquidity, supply_apy)
VALUES (1, 0, 0, 0, 0.08)
ON CONFLICT (id) DO NOTHING;
