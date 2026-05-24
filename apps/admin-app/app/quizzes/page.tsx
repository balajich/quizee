import { listQuizzes } from "@quizee/api-client"
import Link from "next/link"
import QuizTable from "@/components/QuizTable"

export const revalidate = 0

export default async function QuizzesPage() {
  let items = []
  let total = 0
  try {
    const data = await listQuizzes({ published_only: false, limit: 100 })
    items = data.items
    total = data.total
  } catch {
    // services may be offline during build
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total</p>
        </div>
        <Link
          href="/quizzes/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New Quiz
        </Link>
      </div>

      <QuizTable quizzes={items} />
    </div>
  )
}
