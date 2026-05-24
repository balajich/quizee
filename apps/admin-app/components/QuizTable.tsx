"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteQuiz, publishQuiz } from "@quizee/api-client"
import type { QuizSummary } from "@quizee/types"

const DIFF_COLOR: Record<string, string> = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-red-100   text-red-700",
}

export default function QuizTable({ quizzes }: { quizzes: QuizSummary[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function handlePublish(id: string) {
    setBusy(id)
    try { await publishQuiz(id); router.refresh() }
    catch (e: any) { alert(e.message) }
    finally { setBusy(null) }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setBusy(id)
    try { await deleteQuiz(id); router.refresh() }
    catch (e: any) { alert(e.message) }
    finally { setBusy(null) }
  }

  if (!quizzes.length)
    return <p className="text-center text-gray-400 py-16">No quizzes yet. <Link href="/quizzes/new" className="text-indigo-600 underline">Create one →</Link></p>

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {["Title", "Technology", "Difficulty", "Questions", "Status", "Actions"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {quizzes.map(q => (
            <tr key={q.quiz_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">
                <Link href={`/quizzes/${q.quiz_id}`} className="hover:text-indigo-600">{q.title}</Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{q.technology}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
              </td>
              <td className="px-4 py-3 text-gray-500">{q.question_count}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${q.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {q.is_published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link href={`/quizzes/${q.quiz_id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                  {!q.is_published && (
                    <button
                      onClick={() => handlePublish(q.quiz_id)}
                      disabled={busy === q.quiz_id}
                      className="text-xs text-green-600 hover:underline disabled:opacity-40"
                    >
                      {busy === q.quiz_id ? "…" : "Publish"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(q.quiz_id, q.title)}
                    disabled={busy === q.quiz_id}
                    className="text-xs text-red-500 hover:underline disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
