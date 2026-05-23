# Quiz Catalogue — CQRS with Python + FastAPI + PostgreSQL

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Command Service   │     │    Query Service     │
│   POST / DELETE     │     │    GET only          │
│   port 8001         │     │    port 8002         │
└────────┬────────────┘     └──────────┬───────────┘
         │   WRITE                     │   READ
         └──────────────┬──────────────┘
                        │
                ┌───────▼───────┐
                │  PostgreSQL   │
                │  port 5432    │
                └───────────────┘
```

**Command Service** — only writes (create quiz, publish, delete)
**Query Service**   — only reads (list, filter, get detail)
**PostgreSQL**      — single shared datastore (cheap, simple)

---

## Run locally

### Option A — Docker Compose (recommended, one command)

```powershell
cd quiz-cqrs
docker-compose up --build
```

Services available at:
- Command: http://localhost:8001/docs
- Query:   http://localhost:8002/docs

### Option B — Plain Python (no Docker)

```powershell
# Start PostgreSQL separately (Docker)
docker run -d -p 5432:5432 -e POSTGRES_DB=quizdb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password postgres:16-alpine

# Apply schema
docker exec -i <container_id> psql -U postgres -d quizdb < db/schema.sql

# Command service
cd command-service
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python main.py   # runs on port 8001

# Query service (new terminal)
cd query-service
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python main.py   # runs on port 8002
```

---

## API Usage

### Create a quiz (Command Service — port 8001)

```powershell
curl -X POST http://localhost:8001/commands/quizzes `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Python Basics Quiz",
    "description": "Test your Python fundamentals",
    "technology": "Python",
    "difficulty": "Easy",
    "tags": ["variables", "loops"],
    "questions": [
      {
        "text": "Which keyword is used to define a function in Python?",
        "question_type": "MCQ",
        "points": 1,
        "explanation": "The def keyword is used to define functions in Python.",
        "options": [
          {"text": "function", "is_correct": false},
          {"text": "def",      "is_correct": true},
          {"text": "fun",      "is_correct": false},
          {"text": "define",   "is_correct": false}
        ]
      }
    ]
  }'
```

### Publish a quiz

```powershell
curl -X POST http://localhost:8001/commands/quizzes/{quiz_id}/publish
```

### List quizzes (Query Service — port 8002)

```powershell
# All published quizzes
curl http://localhost:8002/queries/quizzes

# Filter by technology
curl "http://localhost:8002/queries/quizzes?technology=Python"

# Filter by technology + difficulty
curl "http://localhost:8002/queries/quizzes?technology=Python&difficulty=Easy"

# Include unpublished (admin view)
curl "http://localhost:8002/queries/quizzes?published_only=false"
```

### Get full quiz detail

```powershell
curl http://localhost:8002/queries/quizzes/{quiz_id}
```

---

## Running Tests

Tests are BDD-style API tests written with [pytest-bdd](https://pytest-bdd.readthedocs.io/) and [Gherkin](https://cucumber.io/docs/gherkin/) feature files. They run against **live services**, so the full stack must be deployed before running them.

### Prerequisites

Start the full stack first:

```bash
bash app.sh up
```

> **If the database schema changed** (e.g. tables were renamed) the existing PostgreSQL
> volume will still hold the old schema — `app.sh up` does not re-initialise it.
> Run a full reset to drop the volume and re-apply the schema before testing:
>
> ```bash
> bash app.sh reset
> ```

Or run individual services:

```bash
bash command-service/scripts/run.sh
bash query-service/scripts/run.sh
```

### Command Service Tests

```bash
bash command-service/scripts/test.sh
```

Covers 11 scenarios across 3 features:

| Feature | Scenarios |
|---|---|
| `create_quiz.feature` | Valid creation, unsupported technology, unsupported difficulty, no correct MCQ option, multiple correct MCQ options, Java quiz with 10 MCQ questions |
| `publish_quiz.feature` | Publish draft quiz, publish already-published quiz (400), publish non-existent quiz (404) |
| `delete_quiz.feature` | Delete existing quiz, delete non-existent quiz (404) |

### Query Service Tests

```bash
bash query-service/scripts/test.sh
```

Covers 8 scenarios across 4 features:

| Feature | Scenarios |
|---|---|
| `list_quizzes.feature` | Paginated list, filter by technology, filter by difficulty |
| `get_quiz.feature` | Get existing quiz with full detail, get non-existent quiz (404) |
| `get_question.feature` | Get existing question with options, get non-existent question (404) |
| `get_technologies.feature` | All supported technologies returned |

> **Note:** Query tests create and publish one shared quiz via the command service at session start, then clean it up on teardown. Both services must be running.

### Override service URLs

By default tests target `localhost`. Pass environment variables to point at a remote deployment:

```bash
# Command service tests against a remote host
COMMAND_URL=http://myserver:8001 bash command-service/scripts/test.sh

# Query service tests against a remote host
COMMAND_URL=http://myserver:8001 QUERY_URL=http://myserver:8002 bash query-service/scripts/test.sh
```

### Run a single feature or scenario

The test scripts pass any extra arguments through to `pytest`:

```bash
# Run one feature file
bash command-service/scripts/test.sh tests/features/create_quiz.feature

# Run by keyword
bash command-service/scripts/test.sh -k "java"

# Stop on first failure
bash command-service/scripts/test.sh -x
```

---

## Cloud Deployment Options (cheap)

### Option 1 — Supabase + Railway (~$0–$5/month)
| Component | Service | Free tier |
|-----------|---------|-----------|
| PostgreSQL | Supabase | 500MB free |
| Command Service | Railway | 500hrs/month free |
| Query Service | Railway | 500hrs/month free |

Steps:
1. Create project at supabase.com → copy connection string
2. Deploy each service to railway.app → set `DATABASE_URL` env var

### Option 2 — Azure Container Apps (~$2–$10/month)
```powershell
# Push images to Azure Container Registry
az acr build --registry <registry> --image quiz-command:latest ./command-service
az acr build --registry <registry> --image quiz-query:latest ./query-service

# Deploy
az containerapp create --name quiz-command --image <registry>.azurecr.io/quiz-command:latest --env-vars DATABASE_URL=<supabase_url>
az containerapp create --name quiz-query  --image <registry>.azurecr.io/quiz-query:latest  --env-vars DATABASE_URL=<supabase_url>
```

### Option 3 — Render.com (~$0/month for hobby)
1. Push to GitHub
2. render.com → New Web Service → connect repo → set `DATABASE_URL`
3. Add PostgreSQL from Render's free database add-on

---

## Project Structure

```
quizee/
├── app.sh                        ← build | up | down | logs (full stack)
├── docker-compose.yml
├── db/
│   └── schema.sql                ← run once to create tables
├── command-service/
│   ├── main.py                   ← POST /commands/quizzes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── scripts/
│   │   ├── build.sh              ← build image
│   │   ├── run.sh                ← start service
│   │   ├── delete.sh             ← stop & remove container
│   │   └── test.sh               ← run BDD tests
│   └── tests/
│       ├── conftest.py           ← fixtures & all step definitions
│       ├── test_create_quiz.py
│       ├── test_publish_quiz.py
│       ├── test_delete_quiz.py
│       ├── requirements.txt
│       └── features/
│           ├── create_quiz.feature
│           ├── publish_quiz.feature
│           └── delete_quiz.feature
└── query-service/
    ├── main.py                   ← GET /queries/quizzes
    ├── requirements.txt
    ├── Dockerfile
    ├── scripts/
    │   ├── build.sh
    │   ├── run.sh
    │   ├── delete.sh
    │   └── test.sh               ← run BDD tests
    └── tests/
        ├── conftest.py           ← fixtures & all step definitions
        ├── test_list_quizzes.py
        ├── test_get_quiz.py
        ├── test_get_question.py
        ├── test_get_technologies.py
        ├── requirements.txt
        └── features/
            ├── list_quizzes.feature
            ├── get_quiz.feature
            ├── get_question.feature
            └── get_technologies.feature
```

## Interactive API docs
Once running, visit:
- http://localhost:8001/docs  (Swagger UI — Command)
- http://localhost:8002/docs  (Swagger UI — Query)
