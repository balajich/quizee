import { getQuiz } from "@quizee/api-client"
import { notFound } from "next/navigation"
import Link from "next/link"
import PublishDeleteButtons from "@/components/PublishDeleteButtons"

export const revalidate = 0

const DIFF_COLOR: Record<string, string> = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-red-100   text-red-700",
}

export default async function QuizDetailPage({ params }: { params: { id: string } }) {
  let quiz
  try {
    quiz = await getQuiz(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/quizzes" className="hover:text-indigo-600">Quizzes</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{quiz.title}</span>
      </nav>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${quiz.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {quiz.is_published ? "Published" : "Draft"}
          </span>
        </div>

        {quiz.description && <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{quiz.technology}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${DIFF_COLOR[quiz.difficulty]}`}>{quiz.difficulty}</span>
          {quiz.tags.map(tag => (
            <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">#{tag}</span>
          ))}
        </div>

        <PublishDeleteButtons quizId={quiz.quiz_id} isPublished={quiz.is_published} />
      </div>

      {/* Questions */}
      <h2 className="font-semibold text-gray-800 mb-3">Questions ({quiz.questions.length})</h2>
      <div className="space-y-4">
        {quiz.questions.map((q, i) => (
          <div key={q.question_id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
              <p className="font-medium text-gray-900">{q.text}</p>
              <span className="ml-auto shrink-0 text-xs text-gray-400">{q.points}pt</span>
            </div>
            <ul className="space-y-1 pl-9">
              {q.options.map(opt => (
                <li key={opt.option_id} className={`flex items-center gap-2 text-sm rounded-lg px-3 py-1.5 ${opt.is_correct ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}`}>
                  <span>{opt.is_correct ? "✓" : "○"}</span>
                  {opt.text}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="mt-3 pl-9 text-xs text-gray-400 italic">💡 {q.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
