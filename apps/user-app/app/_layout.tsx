import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"

const screenOptions = {
  headerStyle: { backgroundColor: "#4F46E5" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" as const },
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ title: "Quizee" }} />
        <Stack.Screen name="quiz/[id]" options={{ title: "Quiz Detail" }} />
        <Stack.Screen name="quiz/[id]/take" options={{ title: "Take Quiz" }} />
        <Stack.Screen name="quiz/[id]/result" options={{ title: "Results" }} />
      </Stack>
    </SafeAreaProvider>
  )
}
