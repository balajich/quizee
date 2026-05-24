"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createQuiz } from "@quizee/api-client"
import type { CreateOptionPayload, CreateQuestionPayload, Difficulty, Technology } from "@quizee/types"

const TECHNOLOGIES: Technology[] = ["Java", "Python", "AI", "JavaScript", "SQL", "DevOps"]
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"]

const BLANK_OPTION  = (): CreateOptionPayload    => ({ text: "", is_correct: false })
const BLANK_QUESTION = (): CreateQuestionPayload  => ({
  text: "", question_type: "MCQ", points: 1,
  explanation: "", reference_link: "",
  options: [BLANK_OPTION(), BLANK_OPTION(), BLANK_OPTION(), BLANK_OPTION()],
})

export default function CreateQuizForm() {
  const router  = useRouter()
  const [title, setTitle]             = useState("")
  const [description, setDescription] = useState("")
  const [technology, setTechnology]   = useState<Technology>("Python")
  const [difficulty, setDifficulty]   = useState<Difficulty>("Easy")
  const [tags, setTags]               = useState("")
  const [questions, setQuestions]     = useState<CreateQuestionPayload[]>([BLANK_QUESTION()])
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function updateQuestion(qi: number, field: keyof CreateQuestionPayload, value: any) {
    setQuestions(qs => qs.map((q, i) => i === qi ? { ...q, [field]: value } : q))
  }

  function updateOption(qi: number, oi: number, field: keyof CreateOptionPayload, value: any) {
    setQuestions(qs => qs.map((q, i) =>
      i !== qi ? q : { ...q, options: q.options.map((o, j) => j === oi ? { ...o, [field]: value } : o) }
    ))
  }

  function setCorrect(qi: number, oi: number) {
    setQuestions(qs => qs.map((q, i) =>
      i !== qi ? q : { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oi })) }
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await createQuiz({
        title, description: description || undefined,
        technology, difficulty,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        questions: questions.map(q => ({
          ...q,
          explanation:    q.explanation    || undefined,
          reference_link: q.reference_link || undefined,
          options: q.options.filter(o => o.text.trim()),
        })),
      })
      router.push(`/quizzes/${result.quiz_id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Quiz details */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Quiz Details</h2>

        <Field label="Title *">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Core Java Fundamentals"
            className="input" />
        </Field>

        <Field label="Description">
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description"
            className="input resize-none" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Technology *">
            <select value={technology} onChange={e => setTechnology(e.target.value as Technology)} className="input">
              {TECHNOLOGIES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Difficulty *">
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="input">
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Tags (comma separated)">
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. oop, collections, streams"
            className="input" />
        </Field>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Question {qi + 1}</h2>
            {questions.length > 1 && (
              <button type="button" onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}
                className="text-xs text-red-500 hover:underline">Remove</button>
            )}
          </div>

          <Field label="Question *">
            <textarea required rows={2} value={q.text} onChange={e => updateQuestion(qi, "text", e.target.value)}
              placeholder="Enter the question" className="input resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select value={q.question_type} onChange={e => updateQuestion(qi, "question_type", e.target.value)} className="input">
                <option>MCQ</option>
                <option>True/False</option>
              </select>
            </Field>
            <Field label="Points">
              <input type="number" min={1} max={10} value={q.points}
                onChange={e => updateQuestion(qi, "points", Number(e.target.value))} className="input" />
            </Field>
          </div>

          {/* Options */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Options — select the correct answer</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-3">
                  <input type="radio" name={`correct-${qi}`} checked={opt.is_correct}
                    onChange={() => setCorrect(qi, oi)}
                    className="h-4 w-4 text-indigo-600 cursor-pointer" />
                  <input value={opt.text} onChange={e => updateOption(qi, oi, "text", e.target.value)}
                    placeholder={`Option ${oi + 1}`} className="input flex-1" />
                </div>
              ))}
            </div>
          </div>

          <Field label="Explanation (optional)">
            <input value={q.explanation ?? ""} onChange={e => updateQuestion(qi, "explanation", e.target.value)}
              placeholder="Explain the correct answer" className="input" />
          </Field>
        </div>
      ))}

      <button type="button" onClick={() => setQuestions(qs => [...qs, BLANK_QUESTION()])}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
        + Add Question
      </button>

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {submitting ? "Creating…" : "Create Quiz"}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}
