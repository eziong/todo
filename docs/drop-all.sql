-- =============================================================
-- Drop All Tables (reverse dependency order)
-- Run this in Supabase SQL Editor to reset the entire schema.
-- WARNING: This deletes ALL data permanently.
-- =============================================================

-- Drop tables (reverse FK dependency order)
drop table if exists sns_reminders cascade;
drop table if exists sns_accounts cascade;
drop table if exists notifications cascade;
drop table if exists sponsorships cascade;
drop table if exists assets cascade;
drop table if exists content_checklists cascade;
drop table if exists contents cascade;
drop table if exists youtube_channels cascade;
drop table if exists google_tokens cascade;
drop table if exists description_templates cascade;
drop table if exists links cascade;
drop table if exists notes cascade;
drop table if exists note_folders cascade;
drop table if exists activity_log cascade;
drop table if exists build_ideas cascade;
drop table if exists ideas cascade;
drop table if exists builds cascade;
drop table if exists build_commands cascade;
drop table if exists recurring_rules cascade;
drop table if exists inbox_items cascade;
drop table if exists todo_tags cascade;
drop table if exists todos cascade;
drop table if exists projects cascade;
drop table if exists tags cascade;

-- Drop trigger function
drop function if exists update_updated_at_column() cascade;
