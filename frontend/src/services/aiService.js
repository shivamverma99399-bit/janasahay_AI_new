import api from "./api";

/**
 * Service for interfacing with direct backend AI chat endpoints.
 */
export const aiService = {
  /**
   * Sends user chat message to the backend.
   */
  async sendChatMessage(message, history = [], userId = "user_001", sessionId = "session_001") {
    let extraDemographics = null;
    let userDocuments = [];

    const isGuest = !userId || userId === "user_001";
    const docKey = isGuest ? "js_user_documents_guest" : `js_user_documents_${userId}`;
    
    try {
      const savedDocs = localStorage.getItem(docKey);
      if (savedDocs) {
        userDocuments = JSON.parse(savedDocs);
      }
    } catch (e) {}

    try {
      if (isGuest) {
        const guestProfileStr = localStorage.getItem("js_profile_guest");
        if (guestProfileStr) {
          extraDemographics = JSON.parse(guestProfileStr);
        }
      } else {
        const extraStr = localStorage.getItem(`js_profile_extra_${userId}`);
        if (extraStr) {
          extraDemographics = JSON.parse(extraStr);
        }
      }
    } catch (e) {}

    const response = await api.post("/ai/chat", {
      userId: userId,
      sessionId: sessionId,
      message,
      language: "en",
      extra_demographics: extraDemographics,
      user_documents: userDocuments
    });

    return {
      answer: response.data.answer,
      matchedSchemes: response.data.matchedSchemes || [],
      eligibility: response.data.eligibility || [],
      recommendedActions: response.data.recommendedActions || [],
      confidence: response.data.confidence || 1.0,
      sources: response.data.sources || []
    };
  },

  /**
   * Clears in-memory session history for the given sessionId.
   */
  async clearChat(sessionId) {
    const response = await api.post("/ai/chat/clear", { sessionId });
    return response.data;
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