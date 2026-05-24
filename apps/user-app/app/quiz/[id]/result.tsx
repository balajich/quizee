import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { Question } from "@quizee/types"

export default function ResultScreen() {
  const { id, answers: answersParam, questions: questionsParam } = useLocalSearchParams<{
    id: string
    answers: string
    questions: string
  }>()
  const router    = useRouter()
  const questions: Question[] = JSON.parse(questionsParam ?? "[]")
  const answers: Record<string, string> = JSON.parse(answersParam ?? "{}")

  const results = questions.map(q => {
    const selected   = q.options.find(o => o.option_id === answers[q.question_id])
    const correct    = q.options.find(o => o.is_correct)
    const isCorrect  = selected?.is_correct ?? false
    return { q, selected, correct, isCorrect }
  })

  const earned = results.filter(r => r.isCorrect).reduce((s, r) => s + r.q.points, 0)
  const total  = questions.reduce((s, q) => s + q.points, 0)
  const pct    = total > 0 ? Math.round((earned / total) * 100) : 0

  const grade = pct >= 80 ? "Excellent 🎉" : pct >= 60 ? "Good job 👍" : pct >= 40 ? "Keep practising 📚" : "Try again 💪"

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score card */}
      <View style={styles.scoreCard}>
        <Text style={styles.gradeText}>{grade}</Text>
        <Text style={styles.scoreNumber}>{pct}%</Text>
        <Text style={styles.scoreDetail}>{earned} / {total} points</Text>
        <Text style={styles.scoreDetail}>
          {results.filter(r => r.isCorrect).length} correct out of {questions.length}
        </Text>
      </View>

      {/* Per-question breakdown */}
      <Text style={styles.sectionTitle}>Review</Text>
      {results.map(({ q, selected, correct, isCorrect }, i) => (
        <View key={q.question_id} style={[styles.reviewCard, isCorrect ? styles.correct : styles.incorrect]}>
          <Text style={styles.reviewIndex}>{i + 1}</Text>
          <View style={styles.reviewBody}>
            <Text style={styles.reviewQuestion}>{q.text}</Text>
            {selected && (
              <Text style={[styles.reviewAnswer, isCorrect ? styles.correctText : styles.incorrectText]}>
                Your answer: {selected.text}
              </Text>
            )}
            {!isCorrect && correct && (
              <Text style={styles.correctAnswerText}>Correct: {correct.text}</Text>
            )}
            {q.explanation && (
              <Text style={styles.explanation}>💡 {q.explanation}</Text>
            )}
          </View>
          <Text style={isCorrect ? styles.tick : styles.cross}>{isCorrect ? "✓" : "✗"}</Text>
        </View>
      ))}

      {/* Actions */}
      <TouchableOpacity style={styles.retakeBtn} onPress={() => router.replace(`/quiz/${id}/take`)}>
        <Text style={styles.retakeBtnText}>Retake Quiz</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/")}>
        <Text style={styles.homeBtnText}>Back to Quizzes</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#F9FAFB" },
  content:            { padding: 16, paddingBottom: 40 },
  scoreCard:          { backgroundColor: "#4F46E5", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20 },
  gradeText:          { color: "#C7D2FE", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  scoreNumber:        { color: "#fff", fontSize: 56, fontWeight: "800" },
  scoreDetail:        { color: "#C7D2FE", fontSize: 13, marginTop: 2 },
  sectionTitle:       { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  reviewCard:         { flexDirection: "row", borderRadius: 10, padding: 12, marginBottom: 8, gap: 10, borderLeftWidth: 4 },
  correct:            { backgroundColor: "#F0FDF4", borderLeftColor: "#10B981" },
  incorrect:          { backgroundColor: "#FEF2F2", borderLeftColor: "#EF4444" },
  reviewIndex:        { fontSize: 12, color: "#6B7280", width: 20, paddingTop: 2 },
  reviewBody:         { flex: 1 },
  reviewQuestion:     { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4 },
  reviewAnswer:       { fontSize: 12, marginBottom: 2 },
  correctText:        { color: "#10B981" },
  incorrectText:      { color: "#EF4444" },
  correctAnswerText:  { fontSize: 12, color: "#10B981", marginBottom: 2 },
  explanation:        { fontSize: 11, color: "#6B7280", fontStyle: "italic", marginTop: 4 },
  tick:               { color: "#10B981", fontSize: 18, fontWeight: "700" },
  cross:              { color: "#EF4444", fontSize: 18, fontWeight: "700" },
  retakeBtn:          { backgroundColor: "#4F46E5", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 20 },
  retakeBtnText:      { color: "#fff", fontWeight: "700", fontSize: 15 },
  homeBtn:            { backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  homeBtnText:        { color: "#374151", fontWeight: "600", fontSize: 15 },
})
