import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { listQuizzes } from "@quizee/api-client"
import type { Difficulty, QuizSummary, Technology } from "@quizee/types"
import QuizCard from "../components/QuizCard"
import FilterBar from "../components/FilterBar"

export default function HomeScreen() {
  const [quizzes, setQuizzes]       = useState<QuizSummary[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [technology, setTechnology] = useState<Technology | undefined>()
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>()
  const [search, setSearch]         = useState("")

  useEffect(() => {
    load()
  }, [technology, difficulty])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await listQuizzes({ technology, difficulty, published_only: true })
      setQuizzes(data.items)
      setTotal(data.total)
    } catch {
      setError("Could not load quizzes. Make sure the services are running.")
    } finally {
      setLoading(false)
    }
  }

  const filtered = search.trim()
    ? quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()))
    : quizzes

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search quizzes..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
      />

      <FilterBar
        technology={technology}
        difficulty={difficulty}
        onTechnologyChange={setTechnology}
        onDifficultyChange={setDifficulty}
      />

      {loading ? (
        <ActivityIndicator style={styles.center} size="large" color="#4F46E5" />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.count}>{total} quiz{total !== 1 ? "zes" : ""} available</Text>
          <FlatList
            data={filtered}
            keyExtractor={q => q.quiz_id}
            renderItem={({ item }) => <QuizCard quiz={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No quizzes match your filters.</Text>
            }
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingHorizontal: 16, paddingTop: 12 },
  search: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  count:     { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  list:      { paddingBottom: 24 },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center", marginBottom: 12 },
  retryBtn:  { backgroundColor: "#4F46E5", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
})
