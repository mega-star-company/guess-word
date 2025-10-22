/**
 * API Configuration for Semantle Game
 */

// For iOS Simulator, use localhost
// For Android Emulator, use 10.0.2.2
// For physical device, use your computer's IP address
const getApiUrl = () => {
  // Development mode - adjust based on your setup
  const LOCAL_IP = "localhost"; // Change to your computer's IP if testing on physical device
  const PORT = "8080";

  return `http://${LOCAL_IP}:${PORT}`;
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  HEALTH: "/",
  START_GAME: "/game/start",
  MAKE_GUESS: "/game/guess",
  GET_GAME_STATE: (gameId: string) => `/game/${gameId}`,
  GIVE_UP: (gameId: string) => `/game/${gameId}/give-up`,
  SIMILARITY: "/similarity",
};
