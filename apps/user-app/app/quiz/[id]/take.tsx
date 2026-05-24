import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { getQuiz } from "@quizee/api-client"
import type { Question } from "@quizee/types"

export default function TakeQuizScreen() {
  const { id }                          = useLocalSearchParams<{ id: string }>()
  const router                          = useRouter()
  const [questions, setQuestions]       = useState<Question[]>([])
  const [current, setCurrent]           = useState(0)
  const [answers, setAnswers]           = useState<Record<string, string>>({})
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    getQuiz(id)
      .then(q => setQuestions(q.questions))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#4F46E5" />

  const q = questions[current]
  if (!q) return null

  const totalQuestions  = questions.length
  const progress        = ((current) / totalQuestions) * 100
  const selectedOption  = answers[q.question_id]
  const isLast          = current === totalQuestions - 1

  function selectOption(option_id: string) {
    setAnswers(prev => ({ ...prev, [q.question_id]: option_id }))
  }

  function next() {
    if (isLast) {
      router.replace({
        pathname: `/quiz/${id}/result`,
        params: { answers: JSON.stringify(answers), questions: JSON.stringify(questions) },
      })
    } else {
      setCurrent(c => c + 1)
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{current + 1} of {totalQuestions}</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>{q.question_type}</Text>
          <Text style={styles.questionText}>{q.text}</Text>
          <Text style={styles.points}>{q.points} point{q.points !== 1 ? "s" : ""}</Text>
        </View>

        {/* Options */}
        {q.options.map(opt => {
          const selected = selectedOption === opt.option_id
          return (
            <TouchableOpacity
              key={opt.option_id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => selectOption(opt.option_id)}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {opt.text}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Next / Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedOption && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!selectedOption}
        >
          <Text style={styles.nextText}>{isLast ? "Submit Quiz" : "Next →"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#F9FAFB" },
  center:             { flex: 1, justifyContent: "center", alignItems: "center" } as any,
  progressBg:         { height: 6, backgroundColor: "#E5E7EB" },
  progressFill:       { height: 6, backgroundColor: "#4F46E5" },
  progressText:       { textAlign: "center", fontSize: 12, color: "#6B7280", paddingVertical: 8 },
  content:            { padding: 16, paddingBottom: 8 },
  questionCard:       { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  questionType:       { fontSize: 11, color: "#4F46E5", fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  questionText:       { fontSize: 17, color: "#111827", fontWeight: "600", lineHeight: 24 },
  points:             { fontSize: 12, color: "#9CA3AF", marginTop: 8 },
  option:             { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: "#E5E7EB", gap: 12 },
  optionSelected:     { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  radio:              { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center" },
  radioSelected:      { borderColor: "#4F46E5" },
  radioDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4F46E5" },
  optionText:         { flex: 1, fontSize: 15, color: "#374151" },
  optionTextSelected: { color: "#4F46E5", fontWeight: "600" },
  footer:             { padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  nextBtn:            { backgroundColor: "#4F46E5", borderRadius: 12, padding: 16, alignItems: "center" },
  nextBtnDisabled:    { backgroundColor: "#C7D2FE" },
  nextText:           { color: "#fff", fontSize: 16, fontWeight: "700" },
})
