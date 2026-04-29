-- D1 schema for chat question logging
-- Run once to create the table:
--   wrangler d1 execute electra-chat-log --file=chat/schema.sql --remote

CREATE TABLE IF NOT EXISTS questions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp       TEXT NOT NULL,                    -- ISO 8601 UTC
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  top_score       REAL,                             -- similarity of best-matched chunk
  chunk_ids       TEXT,                             -- JSON array of retrieved chunk IDs
  chunk_summary   TEXT,                             -- JSON array of {id,type,title,score}
  thin_retrieval  INTEGER NOT NULL DEFAULT 0,       -- 1 if top_score < 0.6
  addressed       INTEGER NOT NULL DEFAULT 0,       -- 1 once an FAQ/node addresses it
  addressed_at    TEXT,                             -- ISO 8601 UTC, when marked
  addressed_note  TEXT,                             -- optional: commit SHA or note
  user_agent      TEXT,                             -- truncated to 200 chars
  origin          TEXT                              -- request origin
);

CREATE INDEX IF NOT EXISTS idx_questions_timestamp ON questions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_questions_thin ON questions(thin_retrieval, addressed, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_questions_addressed ON questions(addressed, timestamp DESC);
