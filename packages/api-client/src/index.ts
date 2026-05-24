import type {
  QuizListResponse,
  QuizDetail,
  Question,
  CreateQuizPayload,
  CommandResult,
  Technology,
  Difficulty,
} from "@quizee/types"

// Supports both Next.js (NEXT_PUBLIC_) and Expo (EXPO_PUBLIC_) env prefixes
const QUERY_URL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_QUERY_URL || process.env.EXPO_PUBLIC_QUERY_URL)) ||
  "http://localhost:8002"

const COMMAND_URL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_COMMAND_URL || process.env.EXPO_PUBLIC_COMMAND_URL)) ||
  "http://localhost:8001"

// ── Query Service ─────────────────────────────────────────────────────────────

export async function listQuizzes(params?: {
  technology?: Technology
  difficulty?: Difficulty
  published_only?: boolean
  limit?: number
  offset?: number
}): Promise<QuizListResponse> {
  const q = new URLSearchParams()
  if (params?.technology)    q.set("technology", params.technology)
  if (params?.difficulty)    q.set("difficulty", params.difficulty)
  if (params?.published_only !== undefined) q.set("published_only", String(params.published_only))
  if (params?.limit)         q.set("limit", String(params.limit))
  if (params?.offset)        q.set("offset", String(params.offset))

  const res = await fetch(`${QUERY_URL}/queries/quizzes?${q}`)
  if (!res.ok) throw new Error("Failed to fetch quizzes")
  return res.json()
}

export async function getQuiz(quiz_id: string): Promise<QuizDetail> {
  const res = await fetch(`${QUERY_URL}/queries/quizzes/${quiz_id}`)
  if (!res.ok) throw new Error("Quiz not found")
  return res.json()
}

export async function getQuestion(quiz_id: string, question_id: string): Promise<Question> {
  const res = await fetch(`${QUERY_URL}/queries/quizzes/${quiz_id}/questions/${question_id}`)
  if (!res.ok) throw new Error("Question not found")
  return res.json()
}

export async function listTechnologies(): Promise<{ technologies: Technology[] }> {
  const res = await fetch(`${QUERY_URL}/queries/technologies`)
  if (!res.ok) throw new Error("Failed to fetch technologies")
  return res.json()
}

// ── Command Service ───────────────────────────────────────────────────────────

export async function createQuiz(payload: CreateQuizPayload): Promise<CommandResult> {
  const res = await fetch(`${COMMAND_URL}/commands/quizzes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to create quiz")
  }
  return res.json()
}

export async function publishQuiz(quiz_id: string): Promise<CommandResult> {
  const res = await fetch(`${COMMAND_URL}/commands/quizzes/${quiz_id}/publish`, {
    method: "POST",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to publish quiz")
  }
  return res.json()
}

export async function deleteQuiz(quiz_id: string): Promise<void> {
  const res = await fetch(`${COMMAND_URL}/commands/quizzes/${quiz_id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete quiz")
}
