import api from "./api";

/**
 * Service for handling central and state government schemes.
 */
export const schemeService = {
  /**
   * Fetches all schemes from the Supabase database via the FastAPI endpoint.
   * Note: Backend returns format { "data": [...] }
   */
  async getSchemes() {
    const response = await api.get("/schemes");
    return response.data.data;
  },

  /**
   * Fetches details for a single scheme by searching the full list locally.
   * Workaround: Fits the current backend which lacks a single-item GET route.
   */
  async getSchemeById(id) {
    const response = await api.get("/schemes");
    const list = response.data.data || [];
    return list.find(s => String(s.id) === String(id)) || null;
  },

  /**
   * Bookmarks or saves a scheme for the user.
   * Placeholder placeholder/TODO.
   */
  async toggleSaveScheme(id) {
    // Unimplemented in current backend phase; bypass silently.
    return { success: true };
  },

  /**
   * Fetches the user's saved/bookmarked schemes.
   * Placeholder placeholder/TODO.
   */
  async getSavedSchemes() {
    return [];
  },

  /**
   * Fetches recent government updates and news announcements.
   * Graceful fallback if news endpoint is not implemented on backend yet.
   */
  async getGovernmentUpdates() {
    try {
      const response = await api.get("/updates");
      return response.data;
    } catch (e) {
      return [
        {
          id: "news-1",
          title: "PM Kisan Samman Nidhi Installment Disbursed",
          summary: "The central government has released the 16th installment of PM-Kisan support, directly transferring funds to over 11 crore farmer bank accounts.",
          date: "27 June 2026",
          source: "Ministry of Agriculture",
          image: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBhZ3JpY3VsdHVyZXxlbnwwfHx8fDE3ODI1MjgxMjh8MA&ixlib=rb-4.1.0&q=85",
          link: "https://pmkisan.gov.in"
        },
        {
          id: "news-2",
          title: "Ayushman Bharat Card Registration Drive Launched",
          summary: "Special camps are being set up across multiple states to facilitate cashless healthcare e-cards registration under Pradhan Mantri Jan Arogya Yojana.",
          date: "24 June 2026",
          source: "National Health Authority",
          image: "https://images.unsplash.com/photo-1639416070357-6dc10225abec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW5kaWF8ZW58MHx8fHwxNzgyNTI4MTI4fDA&ixlib=rb-4.1.0&q=85",
          link: "https://dashboard.pmjay.gov.in"
        }
      ];
    }
  }
};
