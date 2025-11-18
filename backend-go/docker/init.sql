-- Discord Clone Backend Database Initialization Script
-- This script runs automatically when the database container is created for the first time

-- Create additional databases if needed
-- CREATE DATABASE discord_clone_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "citext"; -- For case-insensitive text

-- Set timezone
SET timezone = 'UTC';

-- You can add custom initialization logic here
-- For example, seed data, custom functions, etc.

-- Example: Create a function to generate discriminators
CREATE OR REPLACE FUNCTION generate_discriminator()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
