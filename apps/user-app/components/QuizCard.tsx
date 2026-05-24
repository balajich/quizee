import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useRouter } from "expo-router"
import type { QuizSummary } from "@quizee/types"

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#10B981",
  Medium: "#F59E0B",
  Hard: "#EF4444",
}

export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/quiz/${quiz.quiz_id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{quiz.title}</Text>
        <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[quiz.difficulty] + "20" }]}>
          <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[quiz.difficulty] }]}>
            {quiz.difficulty}
          </Text>
        </View>
      </View>

      {quiz.description ? (
        <Text style={styles.description} numberOfLines={2}>{quiz.description}</Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.techBadge}>
          <Text style={styles.techText}>{quiz.technology}</Text>
        </View>
        <Text style={styles.meta}>{quiz.question_count} questions</Text>
        {quiz.tags.slice(0, 2).map(tag => (
          <Text key={tag} style={styles.tag}>#{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card:        { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 },
  title:       { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },
  diffBadge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText:    { fontSize: 11, fontWeight: "700" },
  description: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 10 },
  footer:      { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  techBadge:   { backgroundColor: "#EEF2FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  techText:    { color: "#4F46E5", fontSize: 11, fontWeight: "600" },
  meta:        { fontSize: 12, color: "#9CA3AF" },
  tag:         { fontSize: 11, color: "#9CA3AF" },
})
