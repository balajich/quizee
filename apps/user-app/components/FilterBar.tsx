import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import type { Difficulty, Technology } from "@quizee/types"

const TECHNOLOGIES: Technology[] = ["Java", "Python", "AI", "JavaScript", "SQL", "DevOps"]
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"]

interface Props {
  technology?: Technology
  difficulty?: Difficulty
  onTechnologyChange: (t: Technology | undefined) => void
  onDifficultyChange: (d: Difficulty | undefined) => void
}

export default function FilterBar({ technology, difficulty, onTechnologyChange, onDifficultyChange }: Props) {
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.rowContent}>
        <Chip label="All" active={!technology} onPress={() => onTechnologyChange(undefined)} />
        {TECHNOLOGIES.map(t => (
          <Chip key={t} label={t} active={technology === t} onPress={() => onTechnologyChange(technology === t ? undefined : t)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.rowContent}>
        <Chip label="Any level" active={!difficulty} onPress={() => onDifficultyChange(undefined)} />
        {DIFFICULTIES.map(d => (
          <Chip key={d} label={d} active={difficulty === d} onPress={() => onDifficultyChange(difficulty === d ? undefined : d)} />
        ))}
      </ScrollView>
    </>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row:          { marginBottom: 10 },
  rowContent:   { gap: 6, paddingRight: 8 },
  chip:         { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive:   { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipText:     { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
})
