/**
 * Game Service - API calls for Semantle game
 */

import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

export interface GameState {
  game_id: string;
  guesses: Guess[];
  guess_count: number;
  game_over: boolean;
  target_word?: string;
  started_at: string;
  clues_used?: number;
  clues_available?: string[];
}

export interface ClueResponse {
  game_id: string;
  clue: string;
  clue_number: number;
  remaining_clues: number;
}

export interface Guess {
  word: string;
  similarity: number;
  guess_number: number;
  rank: number;
  is_correct: boolean;
}

export interface GuessResponse {
  game_id: string;
  word: string;
  similarity: number;
  rank: number;
  percentile?: number;
  guess_number: number;
  is_correct: boolean;
  game_over: boolean;
  top_similarity?: number;
}

export type Difficulty = "easy" | "normal" | "hard";

class GameService {
  /**
   * Check if the API is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`);
      return response.ok;
    } catch (error) {
      console.error("API health check failed:", error);
      return false;
    }
  }

  /**
   * Start a new game
   */
  async startGame(
    difficulty: Difficulty = "normal",
    dailyMode: boolean = false
  ): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.START_GAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ difficulty, daily_mode: dailyMode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to start game");
    }

    return response.json();
  }

  /**
   * Make a guess
   */
  async makeGuess(gameId: string, word: string): Promise<GuessResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MAKE_GUESS}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_id: gameId,
        word: word.toLowerCase().trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to make guess");
    }

    return response.json();
  }

  /**
   * Get current game state
   */
  async getGameState(gameId: string): Promise<GameState> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.GET_GAME_STATE(gameId)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get game state");
    }

    return response.json();
  }

  /**
   * Give up and reveal the answer
   */
  async giveUp(
    gameId: string
  ): Promise<{ game_id: string; target_word: string; message: string }> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.GIVE_UP(gameId)}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to give up");
    }

    return response.json();
  }

  /**
   * Get a clue for the current game (up to 3 clues)
   */
  async getClue(gameId: string): Promise<ClueResponse> {
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/clue`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get clue");
    }

    return response.json();
  }
}

export const gameService = new GameService();
