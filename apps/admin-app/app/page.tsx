import { listQuizzes } from "@quizee/api-client"
import Link from "next/link"

export const revalidate = 30

async function getStats() {
  try {
    const [all, published] = await Promise.all([
      listQuizzes({ published_only: false, limit: 1 }),
      listQuizzes({ published_only: true,  limit: 1 }),
    ])
    return { total: all.total, published: published.total, drafts: all.total - published.total }
  } catch {
    return { total: 0, published: 0, drafts: 0 }
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Quiz Catalogue overview</p>
        </div>
        <Link
          href="/quizzes/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New Quiz
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <StatCard label="Total Quizzes"     value={stats.total}     color="indigo" />
        <StatCard label="Published"          value={stats.published}  color="green"  />
        <StatCard label="Drafts"             value={stats.drafts}     color="amber"  />
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/quizzes"     className="btn-secondary">View All Quizzes</Link>
          <Link href="/quizzes/new" className="btn-primary">Create New Quiz</Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    green:  "bg-green-50  text-green-700  border-green-100",
    amber:  "bg-amber-50  text-amber-700  border-amber-100",
  }
  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-4xl font-bold mt-1">{value}</p>
    </div>
  )
}
