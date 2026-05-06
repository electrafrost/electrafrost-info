-- Migration 001: Add is_showcase flag to existing questions table
-- Run once on the live database:
--   wrangler d1 execute electra-chat-log --file=chat/migrations/001_add_is_showcase.sql --remote

ALTER TABLE questions ADD COLUMN is_showcase INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_questions_showcase ON questions(is_showcase, timestamp DESC);

-- Mark the three canonical FAQ-anchored chip questions as showcase.
-- These are the questions Electra wants displayed in the "Showcase" section
-- of the admin panel, separately from real visitor traffic.
UPDATE questions
SET is_showcase = 1
WHERE question = 'Why does Bitcoin matter to the accounting profession?'
   OR question = 'Why are accountants the missing layer in AI governance?'
   OR question = 'What is network residency?';
