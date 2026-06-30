import api from "./api";

/**
 * Service for interfacing with direct backend AI chat endpoints.
 */
export const aiService = {
  /**
   * Sends user chat message to the backend.
   */
  async sendChatMessage(message, history = [], userId = "user_001") {
    const response = await api.post("/ai/chat", {
      userId: userId,
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
  async checkEligibility(userId, extraDemographics = null) {
    const payload = { user_id: userId };
    if (extraDemographics) {
      payload.extra_demographics = extraDemographics;
    }
    const response = await api.post("/match-schemes", payload);
    return response.data;
  }
};