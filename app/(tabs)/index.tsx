import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
} from "react-native";
import { gameService, GameState } from "@/services/gameService";

export default function SemantleGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [guessInput, setGuessInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  // Check API and start game on mount
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    const connected = await gameService.checkHealth();
    setApiConnected(connected);

    if (connected) {
      startNewGame(true); // Start in daily mode
    }
  };

  const startNewGame = async (dailyMode: boolean = true) => {
    setLoading(true);
    setError("");
    try {
      const newGame = await gameService.startGame("normal", dailyMode);
      setGameState(newGame);
      setGuessInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!guessInput.trim() || !gameState || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await gameService.makeGuess(gameState.game_id, guessInput);

      // Refresh game state
      const updatedState = await gameService.getGameState(gameState.game_id);
      setGameState(updatedState);
      setGuessInput("");

      // Check if won
      if (result.is_correct) {
        setTimeout(() => {
          alert(`🎉 מצאת את המילה ב-${result.guess_number} ניחושים!`);
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בניחוש");
    } finally {
      setLoading(false);
    }
  };

  const handleGiveUp = async () => {
    if (!gameState) return;

    if (confirm("בטוח שאתה רוצה לוותר?")) {
      try {
        const result = await gameService.giveUp(gameState.game_id);
        alert(`המילה הייתה: ${result.target_word}`);
        startNewGame(true);
      } catch (err) {
        setError("שגיאה בוויתור");
      }
    }
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 80) return "#10b981"; // Green - very hot
    if (similarity >= 70) return "#84cc16"; // Lime - hot
    if (similarity >= 60) return "#eab308"; // Yellow - warm
    if (similarity >= 50) return "#f59e0b"; // Amber
    if (similarity >= 40) return "#f97316"; // Orange
    if (similarity >= 30) return "#ef4444"; // Red
    if (similarity >= 20) return "#3b82f6"; // Blue - cold
    return "#6b7280"; // Gray - very cold
  };

  const getTemperatureEmoji = (similarity: number): string => {
    if (similarity >= 80) return "🔥🔥🔥";
    if (similarity >= 70) return "🔥🔥";
    if (similarity >= 60) return "🔥";
    if (similarity >= 50) return "🌡️";
    if (similarity >= 40) return "🌤️";
    if (similarity >= 30) return "☁️";
    if (similarity >= 20) return "❄️";
    return "🧊";
  };

  const getPercentileDisplay = (rank: number, total: number): string => {
    if (total === 0) return "1000/1000";
    const percentile = Math.round(((total - rank + 1) / total) * 1000);
    return `${percentile}/1000`;
  };

  // API not connected
  if (apiConnected === false) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>⚠️ השרת לא רץ</Text>
          <Text style={styles.errorText}>נא להפעיל את השרת:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>cd service-repo</Text>
            <Text style={styles.codeText}>./run.sh</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={initializeGame}>
            <Text style={styles.buttonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading initial game
  if (!gameState) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>טוען את מילת היום...</Text>
        </View>
      </View>
    );
  }

  const topGuess = gameState.guesses.length > 0 ? gameState.guesses[0] : null;

  // Main game UI
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎯 סמנטעל</Text>
          <Text style={styles.subtitle}>משחק המילה היומי</Text>
          <Text style={styles.description}>
            נחש את המילה הסודית לפי דמיון סמנטי
          </Text>
        </View>

        {/* Game stats */}
        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ניחושים</Text>
            <Text style={styles.statValue}>{gameState.guess_count}</Text>
          </View>
          {topGuess && (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>הציון הגבוה</Text>
                <Text style={styles.statValue}>
                  {topGuess.similarity.toFixed(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>דירוג</Text>
                <Text style={styles.statValue}>
                  {getPercentileDisplay(topGuess.rank, gameState.guess_count)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Instructions */}
        {gameState.guesses.length === 0 && (
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              💡 מצא את המילה הסודית! כל ניחוש מראה דמיון סמנטי (0-100)
            </Text>
            <Text style={styles.instructionText}>
              🔥 ציון גבוה יותר = משמעות קרובה יותר
            </Text>
            <Text style={styles.instructionText}>
              📊 הניחושים ממוינים לפי דמיון
            </Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={guessInput}
            onChangeText={setGuessInput}
            placeholder="הקלד ניחוש..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleGuess}
            editable={!loading && !gameState.game_over}
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.guessButton,
              (loading || !guessInput.trim()) && styles.guessButtonDisabled,
            ]}
            onPress={handleGuess}
            disabled={loading || !guessInput.trim() || gameState.game_over}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.guessButtonText}>נחש</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Guesses list */}
        <View style={styles.guessesList}>
          {gameState.guesses.length > 0 && (
            <View style={styles.guessesHeader}>
              <Text style={styles.guessesHeaderText}>
                הניחושים שלך (ממוינים לפי דמיון)
              </Text>
            </View>
          )}

          {gameState.guesses.map((guess, index) => (
            <View
              key={index}
              style={[
                styles.guessItem,
                { borderLeftColor: getSimilarityColor(guess.similarity) },
              ]}
            >
              <View style={styles.guessLeft}>
                <Text style={styles.guessRank}>#{guess.rank}</Text>
                <Text style={styles.guessWord}>
                  {guess.is_correct && "✅ "}
                  {guess.word}
                </Text>
              </View>
              <View style={styles.guessRight}>
                <Text style={styles.guessPercentile}>
                  {getPercentileDisplay(guess.rank, gameState.guess_count)}
                </Text>
                <Text
                  style={[
                    styles.guessSimilarity,
                    { color: getSimilarityColor(guess.similarity) },
                  ]}
                >
                  {guess.similarity.toFixed(1)}
                </Text>
                <Text style={styles.guessEmoji}>
                  {getTemperatureEmoji(guess.similarity)}
                </Text>
              </View>
            </View>
          ))}

          {gameState.guesses.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                עדיין אין ניחושים. נחש מילה! 👆
              </Text>
            </View>
          )}
        </View>

        {/* Footer buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.giveUpButton}
            onPress={handleGiveUp}
            disabled={gameState.game_over}
          >
            <Text style={styles.footerButtonText}>הראה תשובה</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  statsBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  instructions: {
    padding: 16,
    backgroundColor: "#eff6ff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    borderRightWidth: 4,
    borderRightColor: "#3b82f6",
  },
  instructionText: {
    fontSize: 13,
    color: "#1e40af",
    marginBottom: 6,
    textAlign: "right",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#991b1b",
    textAlign: "center",
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: "#f3f4f6",
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    width: "100%",
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 14,
    color: "#374151",
    marginVertical: 2,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: "#ffffff",
    color: "#111827",
    textAlign: "right",
  },
  guessButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 90,
  },
  guessButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  guessButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  guessesList: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  guessesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  guessesHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textAlign: "right",
  },
  guessItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRightWidth: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  guessLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "flex-end",
  },
  guessRank: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9ca3af",
    minWidth: 35,
  },
  guessWord: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "500",
  },
  guessRight: {
    alignItems: "flex-start",
    gap: 2,
  },
  guessPercentile: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  guessSimilarity: {
    fontSize: 20,
    fontWeight: "700",
  },
  guessEmoji: {
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  giveUpButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  newGameButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  footerButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  gameOverBox: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 300,
  },
  gameOverTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  gameOverWord: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 16,
  },
  gameOverStats: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
  },
  playAgainButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
});
