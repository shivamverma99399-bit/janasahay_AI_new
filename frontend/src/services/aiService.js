import api from "./api";

/**
 * Service for interfacing with backend AI workflows (FastAPI -> n8n -> LLM).
 */
export const aiService = {
  /**
   * Sends user chat message to the backend.
   * Workaround: Chatbot endpoint is disabled in this phase. Returns template feedback.
   */
  async sendChatMessage(message, history = []) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          reply: `Saathi chatbot endpoint is ready for integration. This conversation history is stored locally. Your question was: "${message}"`
        });
      }, 800);
    });
  },

  /**
   * Submits active user session ID to verify matches from n8n webhook matcher.
   * Calls: GET /api/dashboard/{user_id}
   */
  async checkEligibility(userId) {
    const response = await api.get(`/dashboard/${userId}`);
    return response.data;
  }
};
