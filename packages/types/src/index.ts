export type Technology = "Java" | "Python" | "AI" | "JavaScript" | "SQL" | "DevOps"
export type Difficulty  = "Easy" | "Medium" | "Hard"
export type QuestionType = "MCQ" | "True/False"

export interface Option {
  option_id: string
  text: string
  is_correct: boolean
  position: number
}

export interface Question {
  question_id: string
  text: string
  question_type: QuestionType
  points: number
  explanation?: string
  reference_link?: string
  position: number
  options: Option[]
}

export interface QuizSummary {
  quiz_id: string
  title: string
  description?: string
  technology: Technology
  difficulty: Difficulty
  is_published: boolean
  tags: string[]
  question_count: number
  created_at: string
}

export interface QuizDetail extends Omit<QuizSummary, "question_count"> {
  questions: Question[]
  updated_at: string
}

export interface QuizListResponse {
  total: number
  items: QuizSummary[]
}

// ── Command payloads ──────────────────────────────────────────────────────────

export interface CreateOptionPayload {
  text: string
  is_correct: boolean
}

export interface CreateQuestionPayload {
  text: string
  question_type: QuestionType
  points: number
  explanation?: string
  reference_link?: string
  options: CreateOptionPayload[]
}

export interface CreateQuizPayload {
  title: string
  description?: string
  technology: Technology
  difficulty: Difficulty
  tags: string[]
  questions: CreateQuestionPayload[]
}

export interface CommandResult {
  success: boolean
  quiz_id: string
  message: string
  created_at: string
}
