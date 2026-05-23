-- Quiz Catalogue Schema
-- Run this once to initialise the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS quiz (
    quiz_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT NOT NULL,
    description TEXT,
    technology  TEXT NOT NULL,   -- Java | Python | AI
    difficulty  TEXT NOT NULL,   -- Easy | Medium | Hard
    is_published BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id     UUID NOT NULL REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'MCQ',  -- MCQ | True/False
    points      INT  DEFAULT 1,
    explanation TEXT,
    reference_link TEXT,
    position    INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS option (
    option_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
    position    INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tag (
    tag_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id  UUID NOT NULL REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    name     TEXT NOT NULL
);

-- Indexes for fast reads
CREATE INDEX IF NOT EXISTS idx_quiz_technology  ON quiz(technology);
CREATE INDEX IF NOT EXISTS idx_quiz_difficulty  ON quiz(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_published   ON quiz(is_published);
CREATE INDEX IF NOT EXISTS idx_question_quiz_id ON question(quiz_id);
CREATE INDEX IF NOT EXISTS idx_option_question_id ON option(question_id);
CREATE INDEX IF NOT EXISTS idx_tag_quiz_id      ON tag(quiz_id);
