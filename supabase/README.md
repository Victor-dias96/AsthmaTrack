# Supabase Configuration and Migrations

This directory contains the database schema and configurations for AsthmaTrack.

- **Chronological order**: Migrations are applied in chronological order based on their timestamped filenames.
- **No secrets**: Never place passwords, API keys, or any secrets in SQL migration files.
- **Manual review**: Hosted migrations require manual review before execution against production environments to ensure safety and correctness.
- **Security first**: Row Level Security (RLS) is mandatory for all public application tables. Always ensure RLS is enabled and appropriate policies are applied when creating new tables.
