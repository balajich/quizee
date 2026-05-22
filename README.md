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
quiz-cqrs/
├── docker-compose.yml
├── db/
│   └── schema.sql           ← run once to create tables
├── command-service/
│   ├── main.py              ← POST /commands/quizzes
│   ├── requirements.txt
│   └── Dockerfile
└── query-service/
    ├── main.py              ← GET /queries/quizzes
    ├── requirements.txt
    └── Dockerfile
```

## Interactive API docs
Once running, visit:
- http://localhost:8001/docs  (Swagger UI — Command)
- http://localhost:8002/docs  (Swagger UI — Query)
