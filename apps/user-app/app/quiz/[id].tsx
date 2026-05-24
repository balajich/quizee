import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { getQuiz } from "@quizee/api-client"
import type { QuizDetail } from "@quizee/types"

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#10B981",
  Medium: "#F59E0B",
  Hard: "#EF4444",
}

export default function QuizDetailScreen() {
  const { id }                    = useLocalSearchParams<{ id: string }>()
  const router                    = useRouter()
  const [quiz, setQuiz]           = useState<QuizDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    getQuiz(id)
      .then(setQuiz)
      .catch(() => setError("Could not load quiz."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#4F46E5" />
  if (error || !quiz)
    return <Text style={[styles.center, styles.errorText]}>{error ?? "Quiz not found."}</Text>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.card}>
        <Text style={styles.title}>{quiz.title}</Text>
        {quiz.description ? <Text style={styles.description}>{quiz.description}</Text> : null}

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{quiz.technology}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: DIFFICULTY_COLOR[quiz.difficulty] + "20" }]}>
            <Text style={[styles.badgeText, { color: DIFFICULTY_COLOR[quiz.difficulty] }]}>
              {quiz.difficulty}
            </Text>
          </View>
        </View>

        {quiz.tags.length > 0 && (
          <View style={styles.tags}>
            {quiz.tags.map(tag => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{quiz.questions.length}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {quiz.questions.reduce((s, q) => s + q.points, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>~{quiz.questions.length * 1}m</Text>
          <Text style={styles.statLabel}>Est. Time</Text>
        </View>
      </View>

      {/* Questions preview */}
      <Text style={styles.sectionTitle}>Questions</Text>
      {quiz.questions.map((q, i) => (
        <View key={q.question_id} style={styles.questionRow}>
          <Text style={styles.qIndex}>{i + 1}</Text>
          <Text style={styles.qText} numberOfLines={2}>{q.text}</Text>
          <Text style={styles.qPoints}>{q.points}pt</Text>
        </View>
      ))}

      {/* Start button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() => router.push(`/quiz/${id}/take`)}
      >
        <Text style={styles.startText}>Start Quiz →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#F9FAFB" },
  content:     { padding: 16, paddingBottom: 40 },
  center:      { flex: 1, justifyContent: "center", alignItems: "center" } as any,
  errorText:   { color: "#EF4444" },
  card:        { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  title:       { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  description: { fontSize: 14, color: "#6B7280", marginBottom: 10, lineHeight: 20 },
  badges:      { flexDirection: "row", gap: 8, marginBottom: 8 },
  badge:       { backgroundColor: "#EEF2FF", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { color: "#4F46E5", fontSize: 12, fontWeight: "600" },
  tags:        { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag:         { fontSize: 12, color: "#9CA3AF" },
  statsRow:    { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  stat:        { flex: 1, alignItems: "center" },
  statNumber:  { fontSize: 22, fontWeight: "700", color: "#4F46E5" },
  statLabel:   { fontSize: 11, color: "#6B7280", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  questionRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 6, gap: 10 },
  qIndex:      { width: 24, height: 24, borderRadius: 12, backgroundColor: "#EEF2FF", textAlign: "center", lineHeight: 24, fontSize: 12, fontWeight: "700", color: "#4F46E5" },
  qText:       { flex: 1, fontSize: 13, color: "#374151" },
  qPoints:     { fontSize: 12, color: "#9CA3AF" },
  startBtn:    { backgroundColor: "#4F46E5", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  startText:   { color: "#fff", fontSize: 17, fontWeight: "700" },
})
