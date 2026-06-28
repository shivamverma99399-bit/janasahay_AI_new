import api from "./api";

/**
 * Service for interfacing with backend AI workflows (FastAPI -> n8n -> LLM).
 */
export const aiService = {
  /**
   * Sends user chat message to the backend.
   */
  async sendChatMessage(message, history = []) {
    const response = await api.post("/ai/chat", {
      userId: "user_001",
      sessionId: "session_001",
      message,
      language: "en"
    });

    return {
      reply: response.data.response,
      schemes: response.data.schemes || [],
      cta: response.data.cta || null
    };
  }, // <-- THIS COMMA WAS MISSING

  /**
   * Submits active user session ID to verify matches from n8n webhook matcher.
   * Calls: GET /api/dashboard/{user_id}
   */
  async checkEligibility(userId) {
    const response = await api.post("/match-schemes", { user_id: userId });
    return response.data;
  }
};