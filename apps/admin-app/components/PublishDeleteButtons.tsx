"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteQuiz, publishQuiz } from "@quizee/api-client"

export default function PublishDeleteButtons({ quizId, isPublished }: { quizId: string; isPublished: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handlePublish() {
    setBusy(true)
    try { await publishQuiz(quizId); router.refresh() }
    catch (e: any) { alert(e.message) }
    finally { setBusy(false) }
  }

  async function handleDelete() {
    if (!confirm("Delete this quiz? This cannot be undone.")) return
    setBusy(true)
    try { await deleteQuiz(quizId); router.push("/quizzes") }
    catch (e: any) { alert(e.message); setBusy(false) }
  }

  return (
    <div className="flex gap-3">
      {!isPublished && (
        <button onClick={handlePublish} disabled={busy}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
          {busy ? "Publishing…" : "Publish Quiz"}
        </button>
      )}
      <button onClick={handleDelete} disabled={busy}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors">
        {busy ? "Deleting…" : "Delete Quiz"}
      </button>
    </div>
  )
}
