-- Quiz Catalogue Schema
-- Run this once to initialise the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT NOT NULL,
    description TEXT,
    technology  TEXT NOT NULL,   -- Java | Python | AI
    difficulty  TEXT NOT NULL,   -- Easy | Medium | Hard
    is_published BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id     UUID NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'MCQ',  -- MCQ | True/False
    points      INT  DEFAULT 1,
    explanation TEXT,
    reference_link TEXT,
    position    INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS options (
    option_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
    position    INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
    tag_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id  UUID NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    name     TEXT NOT NULL
);

-- Indexes for fast reads
CREATE INDEX IF NOT EXISTS idx_quizzes_technology  ON quizzes(technology);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty  ON quizzes(difficulty);
CREATE INDEX IF NOT EXISTS idx_quizzes_published   ON quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id   ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_tags_quiz_id        ON tags(quiz_id);
