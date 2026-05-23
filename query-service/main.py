"""
QUERY SERVICE  —  Quiz Catalogue CQRS
Handles: list quizzes, get quiz by id, filter by technology/difficulty
Port: 8002
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from pydantic import BaseModel, UUID4
from typing import List, Optional
import asyncpg
import os

app = FastAPI(title="Quiz Catalogue — Query Service", version="1.0.0")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/quizdb")

# ─── DB connection ────────────────────────────────────────────────────────────

async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

@app.on_event("startup")
async def startup():
    print(f"Query Service started. DB: {DATABASE_URL}")

# ─── Read models (output) ─────────────────────────────────────────────────────

class OptionView(BaseModel):
    option_id: str
    text: str
    is_correct: bool
    position: int

class QuestionView(BaseModel):
    question_id: str
    text: str
    question_type: str
    points: int
    explanation: Optional[str]
    reference_link: Optional[str]
    position: int
    options: List[OptionView]

class QuizSummaryView(BaseModel):
    quiz_id: str
    title: str
    description: Optional[str]
    technology: str
    difficulty: str
    is_published: bool
    tags: List[str]
    question_count: int
    created_at: str

class QuizDetailView(BaseModel):
    quiz_id: str
    title: str
    description: Optional[str]
    technology: str
    difficulty: str
    is_published: bool
    tags: List[str]
    questions: List[QuestionView]
    created_at: str
    updated_at: str

class QuizListResponse(BaseModel):
    total: int
    items: List[QuizSummaryView]

# ─── Query handlers ───────────────────────────────────────────────────────────

async def query_quiz_list(
    conn: asyncpg.Connection,
    technology: Optional[str],
    difficulty: Optional[str],
    published_only: bool,
    limit: int,
    offset: int
) -> QuizListResponse:

    filters = []
    params = []
    idx = 1

    if technology:
        filters.append(f"q.technology = ${idx}"); params.append(technology); idx += 1
    if difficulty:
        filters.append(f"q.difficulty = ${idx}"); params.append(difficulty); idx += 1
    if published_only:
        filters.append(f"q.is_published = TRUE")

    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    rows = await conn.fetch(f"""
        SELECT
            q.quiz_id::text,
            q.title,
            q.description,
            q.technology,
            q.difficulty,
            q.is_published,
            q.created_at,
            COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), ARRAY[]::text[]) AS tags,
            COUNT(DISTINCT qs.question_id) AS question_count
        FROM quiz q
        LEFT JOIN tag t ON t.quiz_id = q.quiz_id
        LEFT JOIN question qs ON qs.quiz_id = q.quiz_id
        {where}
        GROUP BY q.quiz_id
        ORDER BY q.created_at DESC
        LIMIT ${idx} OFFSET ${idx+1}
    """, *params, limit, offset)

    count_row = await conn.fetchrow(f"""
        SELECT COUNT(*) FROM quiz q {where}
    """, *params)

    items = [
        QuizSummaryView(
            quiz_id=r["quiz_id"],
            title=r["title"],
            description=r["description"],
            technology=r["technology"],
            difficulty=r["difficulty"],
            is_published=r["is_published"],
            tags=list(r["tags"]),
            question_count=r["question_count"],
            created_at=r["created_at"].isoformat()
        ) for r in rows
    ]
    return QuizListResponse(total=count_row["count"], items=items)


async def query_quiz_detail(conn: asyncpg.Connection, quiz_id: str) -> QuizDetailView:
    quiz = await conn.fetchrow("""
        SELECT quiz_id::text, title, description, technology, difficulty,
               is_published, created_at, updated_at
        FROM quiz WHERE quiz_id = $1
    """, quiz_id)

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    tag_rows = await conn.fetch(
        "SELECT name FROM tag WHERE quiz_id = $1", quiz_id
    )
    question_rows = await conn.fetch("""
        SELECT question_id::text, text, question_type, points,
               explanation, reference_link, position
        FROM question WHERE quiz_id = $1 ORDER BY position
    """, quiz_id)

    questions = []
    for q in question_rows:
        option_rows = await conn.fetch("""
            SELECT option_id::text, text, is_correct, position
            FROM option WHERE question_id = $1 ORDER BY position
        """, q["question_id"])
        questions.append(QuestionView(
            question_id=q["question_id"],
            text=q["text"],
            question_type=q["question_type"],
            points=q["points"],
            explanation=q["explanation"],
            reference_link=q["reference_link"],
            position=q["position"],
            options=[OptionView(**dict(o)) for o in option_rows]
        ))

    return QuizDetailView(
        quiz_id=quiz["quiz_id"],
        title=quiz["title"],
        description=quiz["description"],
        technology=quiz["technology"],
        difficulty=quiz["difficulty"],
        is_published=quiz["is_published"],
        tags=[r["name"] for r in tag_rows],
        questions=questions,
        created_at=quiz["created_at"].isoformat(),
        updated_at=quiz["updated_at"].isoformat()
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "query"}


@app.get("/queries/quizzes", response_model=QuizListResponse)
async def list_quizzes(
    technology: Optional[str] = Query(None, description="Java | Python | AI | JavaScript | SQL | DevOps"),
    difficulty: Optional[str] = Query(None, description="Easy | Medium | Hard"),
    published_only: bool = Query(True),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    conn=Depends(get_db)
):
    """List quizzes with optional filters."""
    return await query_quiz_list(conn, technology, difficulty, published_only, limit, offset)


@app.get("/queries/quizzes/{quiz_id}", response_model=QuizDetailView)
async def get_quiz(quiz_id: str, conn=Depends(get_db)):
    """Get full quiz detail including all questions and options."""
    return await query_quiz_detail(conn, quiz_id)


@app.get("/queries/technologies")
async def list_technologies():
    """Return all supported technologies."""
    return {"technologies": ["Java", "Python", "AI", "JavaScript", "SQL", "DevOps"]}


@app.get("/queries/quizzes/{quiz_id}/questions/{question_id}", response_model=QuestionView)
async def get_question(quiz_id: str, question_id: str, conn=Depends(get_db)):
    """Get a single question with its options."""
    row = await conn.fetchrow("""
        SELECT question_id::text, text, question_type, points,
               explanation, reference_link, position
        FROM question WHERE question_id = $1 AND quiz_id = $2
    """, question_id, quiz_id)

    if not row:
        raise HTTPException(status_code=404, detail="Question not found")

    options = await conn.fetch("""
        SELECT option_id::text, text, is_correct, position
        FROM option WHERE question_id = $1 ORDER BY position
    """, question_id)

    return QuestionView(
        **dict(row), options=[OptionView(**dict(o)) for o in options]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
