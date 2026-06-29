import api from "./api";

/**
 * Service for interfacing with direct backend AI chat endpoints.
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
  },

  /**
   * Checks scheme eligibility for the user.
   */
  async checkEligibility(userId) {
    const response = await api.post("/match-schemes", { user_id: userId });
    return response.data;
  }
};