# Quizee — Quiz Catalogue Platform

A full-stack quiz platform built with a CQRS backend (Python + FastAPI + PostgreSQL) and two front-end applications — a cross-platform user app (React Native + Expo) and a web-based admin app (Next.js).

---

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                     Front-end Apps                   │
│                                                      │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  User App           │  │  Admin App             │ │
│  │  React Native/Expo  │  │  Next.js 15            │ │
│  │  Web · Android · iOS│  │  Web only              │ │
│  │  port 8081          │  │  port 3001             │ │
│  └──────────┬──────────┘  └──────────┬─────────────┘ │
└─────────────┼────────────────────────┼───────────────┘
              │ reads                  │ reads + writes
              ▼                        ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Query Service     │     │   Command Service   │
│   GET only          │     │   POST / DELETE     │
│   port 8002         │     │   port 8001         │
└──────────┬──────────┘     └──────────┬──────────┘
           │   READ                    │   WRITE
           └──────────────┬────────────┘
                          │
                  ┌───────▼───────┐
                  │  PostgreSQL   │
                  │  port 5432    │
                  └───────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| User App | React Native + Expo 52 | Browse and take quizzes (Web, Android, iOS) |
| Admin App | Next.js 15 + Tailwind CSS | Create, publish and delete quizzes (Web) |
| Query Service | Python + FastAPI | Read-only API — list, filter, get quizzes |
| Command Service | Python + FastAPI | Write API — create, publish, delete quizzes |
| Database | PostgreSQL 16 | Shared datastore |

## Ports

| Service | Port | URL |
|---|---|---|
| User App | 8081 | http://localhost:8081 |
| Admin App | 3001 | http://localhost:3001 |
| Command Service | 8001 | http://localhost:8001/docs |
| Query Service | 8002 | http://localhost:8002/docs |
| PostgreSQL | 5432 | localhost:5432 |

---

## Prerequisites

| Tool | Version | Required for |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | any recent | Backend services |
| [Node.js](https://nodejs.org/) | 18+ (v22 or v24 LTS recommended) | UI apps |
| [Git](https://git-scm.com/) | any | Version control |

---

## Quick Start

### 1 — Start the backend

```bash
bash app.sh up
```

This builds and starts PostgreSQL, Command Service, and Query Service via Docker Compose.

> **First time or after a schema change?** Run a full reset to wipe the volume and re-apply the schema:
> ```bash
> bash app.sh reset
> ```

Verify the backend is running:
- Command Service: http://localhost:8001/docs
- Query Service:   http://localhost:8002/docs

### 2 — Install front-end dependencies

```bash
# From the repo root — installs all workspaces at once
npm install
```

### 3 — Set up environment variables

```bash
# User app
cp apps/user-app/.env.example apps/user-app/.env

# Admin app
cp apps/admin-app/.env.local.example apps/admin-app/.env.local
```

The defaults (`localhost:8001` / `localhost:8002`) work out of the box for local development. Edit the files only if your backend runs on a different host or port.

### 4 — Start the UI apps

```bash
# From the repo root — starts both apps in parallel
npm run dev
```

| App | URL |
|---|---|
| User App (Web) | http://localhost:8081 |
| Admin App | http://localhost:3001 |

---

## User App — React Native + Expo

Cross-platform app for browsing and taking quizzes. Runs on **Web, Android and iOS** from a single codebase.

### Screens

| Screen | Route | Description |
|---|---|---|
| Quiz List | `/` | Browse all quizzes with search, technology and difficulty filters |
| Quiz Detail | `/quiz/[id]` | Quiz info, stats (questions, points, estimated time), start button |
| Take Quiz | `/quiz/[id]/take` | One question at a time with progress bar and option selection |
| Results | `/quiz/[id]/result` | Score, per-question review with correct answers and explanations |

### Running individually

```bash
cd apps/user-app

# Web browser
npx expo start --web          # opens http://localhost:8081

# Android (requires Android Studio emulator or connected device)
npx expo start
# then press 'a' in the Expo terminal

# iOS (Mac only — requires Xcode)
npx expo start
# then press 'i' in the Expo terminal
```

### Environment variables (`apps/user-app/.env`)

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_QUERY_URL` | `http://localhost:8002` | Query service base URL |
| `EXPO_PUBLIC_COMMAND_URL` | `http://localhost:8001` | Command service base URL |

---

## Admin App — Next.js 15

Web-only app for content administrators to manage the quiz catalogue.

### Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Stats overview — total, published, and draft quiz counts |
| Quiz List | `/quizzes` | Table of all quizzes with inline publish and delete actions |
| Create Quiz | `/quizzes/new` | Form to create a quiz with dynamic questions and MCQ options |
| Quiz Detail | `/quizzes/[id]` | Full quiz view with questions, answers, publish and delete buttons |

### Running individually

```bash
cd apps/admin-app
npm run dev          # opens http://localhost:3001
```

### Environment variables (`apps/admin-app/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_QUERY_URL` | `http://localhost:8002` | Query service base URL |
| `NEXT_PUBLIC_COMMAND_URL` | `http://localhost:8001` | Command service base URL |

---

## Backend Services

### Command Service (port 8001)

Handles all write operations.

```bash
# Create a quiz
curl -X POST http://localhost:8001/commands/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Basics Quiz",
    "technology": "Python",
    "difficulty": "Easy",
    "tags": ["variables", "loops"],
    "questions": [
      {
        "text": "Which keyword defines a function in Python?",
        "question_type": "MCQ",
        "points": 1,
        "explanation": "The def keyword is used to define functions.",
        "options": [
          {"text": "function", "is_correct": false},
          {"text": "def",      "is_correct": true},
          {"text": "fun",      "is_correct": false},
          {"text": "define",   "is_correct": false}
        ]
      }
    ]
  }'

# Publish a quiz
curl -X POST http://localhost:8001/commands/quizzes/{quiz_id}/publish

# Delete a quiz
curl -X DELETE http://localhost:8001/commands/quizzes/{quiz_id}
```

### Query Service (port 8002)

Handles all read operations.

```bash
# List all published quizzes
curl http://localhost:8002/queries/quizzes

# Filter by technology
curl "http://localhost:8002/queries/quizzes?technology=Python"

# Filter by technology and difficulty
curl "http://localhost:8002/queries/quizzes?technology=Python&difficulty=Easy"

# Include unpublished quizzes (admin view)
curl "http://localhost:8002/queries/quizzes?published_only=false"

# Get full quiz detail
curl http://localhost:8002/queries/quizzes/{quiz_id}

# Get supported technologies
curl http://localhost:8002/queries/technologies
```

### Backend lifecycle scripts

```bash
bash app.sh build    # build Docker images
bash app.sh up       # start all services (detached)
bash app.sh down     # stop all services
bash app.sh reset    # wipe volume + restart (use after schema changes)
bash app.sh logs     # tail all logs
bash app.sh logs command-service   # tail one service
```

Individual service scripts:

```bash
bash command-service/scripts/build.sh
bash command-service/scripts/run.sh
bash command-service/scripts/delete.sh

bash query-service/scripts/build.sh
bash query-service/scripts/run.sh
bash query-service/scripts/delete.sh
```

---

## Running Tests

BDD-style API tests written with [pytest-bdd](https://pytest-bdd.readthedocs.io/) and Gherkin feature files. Tests run against **live services** — start the backend before running them.

### Command Service Tests

```bash
bash command-service/scripts/test.sh
```

| Feature | Scenarios |
|---|---|
| `create_quiz.feature` | Valid creation, unsupported technology, unsupported difficulty, no correct option, multiple correct options, Java quiz with 10 MCQ questions |
| `publish_quiz.feature` | Publish draft, publish already-published (400), publish non-existent (404) |
| `delete_quiz.feature` | Delete existing quiz, delete non-existent (404) |

### Query Service Tests

```bash
bash query-service/scripts/test.sh
```

| Feature | Scenarios |
|---|---|
| `list_quizzes.feature` | Paginated list, filter by technology, filter by difficulty |
| `get_quiz.feature` | Full quiz detail, non-existent quiz (404) |
| `get_question.feature` | Question with options, non-existent question (404) |
| `get_technologies.feature` | All supported technologies returned |

> Query tests create and publish one shared quiz at session start, then clean it up on teardown. Both services must be running.

### HTML test report

Each test run generates a self-contained HTML report:

```
command-service/tests/report.html
query-service/tests/report.html
```

The report includes HTTP request and response payloads captured for every scenario.

### Override service URLs

```bash
# Point command tests at a remote server
COMMAND_URL=http://myserver:8001 bash command-service/scripts/test.sh

# Point query tests at a remote server
COMMAND_URL=http://myserver:8001 QUERY_URL=http://myserver:8002 bash query-service/scripts/test.sh
```

### Run a single feature or scenario

```bash
# Run one feature file
bash command-service/scripts/test.sh tests/features/create_quiz.feature

# Run by keyword
bash command-service/scripts/test.sh -k "java"

# Stop on first failure
bash command-service/scripts/test.sh -x
```

---

## Project Structure

```
quizee/
├── package.json                    ← npm workspaces root
├── turbo.json                      ← Turborepo pipeline (dev, build, lint)
├── app.sh                          ← backend lifecycle (up | down | reset | logs)
├── docker-compose.yml
├── db/
│   └── schema.sql                  ← PostgreSQL schema
│
├── packages/
│   ├── types/                      ← @quizee/types — shared TypeScript types
│   │   └── src/index.ts            ← Quiz, Question, Option, payloads…
│   └── api-client/                 ← @quizee/api-client — shared fetch wrapper
│       └── src/index.ts            ← listQuizzes, getQuiz, createQuiz…
│
├── apps/
│   ├── user-app/                   ← React Native + Expo 52
│   │   ├── app.json
│   │   ├── .env.example
│   │   ├── app/
│   │   │   ├── _layout.tsx         ← root Stack navigator
│   │   │   ├── index.tsx           ← quiz list with search + filters
│   │   │   └── quiz/
│   │   │       ├── [id].tsx        ← quiz detail + stats
│   │   │       └── [id]/
│   │   │           ├── take.tsx    ← interactive quiz (one question at a time)
│   │   │           └── result.tsx  ← score + per-question review
│   │   └── components/
│   │       ├── QuizCard.tsx        ← quiz list card
│   │       └── FilterBar.tsx       ← technology + difficulty filter chips
│   │
│   └── admin-app/                  ← Next.js 15 + Tailwind CSS
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── .env.local.example
│       ├── app/
│       │   ├── layout.tsx          ← root layout with sidebar
│       │   ├── globals.css
│       │   ├── page.tsx            ← dashboard with stats
│       │   └── quizzes/
│       │       ├── page.tsx        ← quiz list table
│       │       ├── new/page.tsx    ← create quiz form
│       │       └── [id]/page.tsx   ← quiz detail + actions
│       └── components/
│           ├── Sidebar.tsx         ← navigation sidebar
│           ├── QuizTable.tsx       ← quiz list with publish/delete
│           ├── CreateQuizForm.tsx  ← dynamic multi-question form
│           └── PublishDeleteButtons.tsx
│
├── command-service/
│   ├── main.py                     ← FastAPI app (writes)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── scripts/
│   │   ├── build.sh
│   │   ├── run.sh
│   │   ├── delete.sh
│   │   └── test.sh                 ← BDD test runner
│   └── tests/
│       ├── conftest.py             ← fixtures + step definitions + HTTP capture
│       ├── requirements.txt
│       ├── test_create_quiz.py
│       ├── test_publish_quiz.py
│       ├── test_delete_quiz.py
│       └── features/
│           ├── create_quiz.feature
│           ├── publish_quiz.feature
│           └── delete_quiz.feature
│
└── query-service/
    ├── main.py                     ← FastAPI app (reads)
    ├── requirements.txt
    ├── Dockerfile
    ├── scripts/
    │   ├── build.sh
    │   ├── run.sh
    │   ├── delete.sh
    │   └── test.sh                 ← BDD test runner
    └── tests/
        ├── conftest.py             ← fixtures + step definitions + HTTP capture
        ├── requirements.txt
        ├── test_list_quizzes.py
        ├── test_get_quiz.py
        ├── test_get_question.py
        ├── test_get_technologies.py
        └── features/
            ├── list_quizzes.feature
            ├── get_quiz.feature
            ├── get_question.feature
            └── get_technologies.feature
```

---

## Supported Technologies and Difficulties

**Technologies:** Java · Python · AI · JavaScript · SQL · DevOps

**Difficulties:** Easy · Medium · Hard

---

## Cloud Deployment

### Option 1 — Supabase + Railway (~$0–$5/month)

| Component | Service | Free tier |
|---|---|---|
| PostgreSQL | [Supabase](https://supabase.com) | 500 MB |
| Command Service | [Railway](https://railway.app) | 500 hrs/month |
| Query Service | [Railway](https://railway.app) | 500 hrs/month |

1. Create a project at supabase.com → copy the connection string
2. Deploy each service to railway.app → set the `DATABASE_URL` environment variable

### Option 2 — Azure Container Apps (~$2–$10/month)

```powershell
az acr build --registry <registry> --image quiz-command:latest ./command-service
az acr build --registry <registry> --image quiz-query:latest  ./query-service

az containerapp create --name quiz-command --image <registry>.azurecr.io/quiz-command:latest --env-vars DATABASE_URL=<connection_string>
az containerapp create --name quiz-query  --image <registry>.azurecr.io/quiz-query:latest  --env-vars DATABASE_URL=<connection_string>
```

### Option 3 — Render.com (~$0/month hobby)

1. Push to GitHub
2. render.com → New Web Service → connect repo → set `DATABASE_URL`
3. Add a PostgreSQL instance from Render's database add-on
