import CreateQuizForm from "@/components/CreateQuizForm"

export default function NewQuizPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new quiz with questions and options</p>
      </div>
      <CreateQuizForm />
    </div>
  )
}
