"""
COMMAND SERVICE  —  Quiz Catalogue CQRS
Handles: create quiz, add questions, publish quiz
Port: 8001
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, UUID4
from typing import List, Optional
from uuid import uuid4
from datetime import datetime, timezone
import asyncpg
import os

app = FastAPI(title="Quiz Catalogue — Command Service", version="1.0.0")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/quizdb")

# ─── DB connection pool ───────────────────────────────────────────────────────

async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

@app.on_event("startup")
async def startup():
    print(f"Command Service started. DB: {DATABASE_URL}")

# ─── Command models (input) ───────────────────────────────────────────────────

class CreateOptionCommand(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool

class CreateQuestionCommand(BaseModel):
    text: str = Field(..., min_length=5)
    question_type: str = Field(default="MCQ", pattern="^(MCQ|True/False)$")
    points: int = Field(default=1, ge=1, le=10)
    explanation: Optional[str] = None
    reference_link: Optional[str] = None
    options: List[CreateOptionCommand] = Field(..., min_length=2, max_length=4)

class CreateQuizCommand(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    technology: str = Field(..., pattern="^(Java|Python|AI|JavaScript|SQL|DevOps)$")
    difficulty: str = Field(..., pattern="^(Easy|Medium|Hard)$")
    tags: Optional[List[str]] = []
    questions: List[CreateQuestionCommand] = Field(..., min_length=1)

class PublishQuizCommand(BaseModel):
    quiz_id: UUID4

# ─── Response models ──────────────────────────────────────────────────────────

class CommandResult(BaseModel):
    success: bool
    quiz_id: str
    message: str
    created_at: str

# ─── Command handlers ─────────────────────────────────────────────────────────

async def handle_create_quiz(cmd: CreateQuizCommand, conn: asyncpg.Connection) -> str:
    quiz_id = str(uuid4())
    now = datetime.now(timezone.utc)

    async with conn.transaction():
        # Insert quiz
        await conn.execute("""
            INSERT INTO quiz (quiz_id, title, description, technology, difficulty, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $6)
        """, quiz_id, cmd.title, cmd.description, cmd.technology, cmd.difficulty, now)

        # Insert tags
        for tag_name in (cmd.tags or []):
            await conn.execute("""
                INSERT INTO tag (tag_id, quiz_id, name) VALUES ($1, $2, $3)
            """, str(uuid4()), quiz_id, tag_name.strip().lower())

        # Insert questions + options
        for position, q in enumerate(cmd.questions):
            question_id = str(uuid4())
            await conn.execute("""
                INSERT INTO question (question_id, quiz_id, text, question_type, points,
                                      explanation, reference_link, position, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, question_id, quiz_id, q.text, q.question_type, q.points,
                q.explanation, q.reference_link, position, now)

            for opt_pos, opt in enumerate(q.options):
                await conn.execute("""
                    INSERT INTO option (option_id, question_id, text, is_correct, position)
                    VALUES ($1, $2, $3, $4, $5)
                """, str(uuid4()), question_id, opt.text, opt.is_correct, opt_pos)

    return quiz_id


async def handle_publish_quiz(quiz_id: str, conn: asyncpg.Connection):
    result = await conn.fetchrow(
        "SELECT quiz_id, is_published FROM quiz WHERE quiz_id = $1", quiz_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if result["is_published"]:
        raise HTTPException(status_code=400, detail="Quiz is already published")

    await conn.execute("""
        UPDATE quiz SET is_published = TRUE, updated_at = $1 WHERE quiz_id = $2
    """, datetime.now(timezone.utc), quiz_id)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "command"}


@app.post("/commands/quizzes", response_model=CommandResult, status_code=201)
async def create_quiz(cmd: CreateQuizCommand, conn=Depends(get_db)):
    """Create a new quiz with questions and options."""
    # Validate each MCQ question has exactly one correct answer
    for q in cmd.questions:
        if q.question_type == "MCQ":
            correct_count = sum(1 for o in q.options if o.is_correct)
            if correct_count != 1:
                raise HTTPException(
                    status_code=422,
                    detail=f"MCQ question must have exactly 1 correct answer, found {correct_count}"
                )

    quiz_id = await handle_create_quiz(cmd, conn)
    return CommandResult(
        success=True,
        quiz_id=quiz_id,
        message=f"Quiz '{cmd.title}' created successfully",
        created_at=datetime.now(timezone.utc).isoformat()
    )


@app.post("/commands/quizzes/{quiz_id}/publish", response_model=CommandResult)
async def publish_quiz(quiz_id: str, conn=Depends(get_db)):
    """Publish a quiz so it becomes visible to users."""
    await handle_publish_quiz(quiz_id, conn)
    return CommandResult(
        success=True,
        quiz_id=quiz_id,
        message="Quiz published successfully",
        created_at=datetime.now(timezone.utc).isoformat()
    )


@app.delete("/commands/quizzes/{quiz_id}", status_code=204)
async def delete_quiz(quiz_id: str, conn=Depends(get_db)):
    """Delete a quiz and all its questions/options (cascade)."""
    result = await conn.execute("DELETE FROM quiz WHERE quiz_id = $1", quiz_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Quiz not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
