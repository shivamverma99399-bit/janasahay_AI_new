import api from "./api";

/**
 * Service for fetching government scheme updates and announcements from backend API.
 */
export const updatesService = {
  /**
   * Fetches latest updates list.
   */
  async getUpdates() {
    const response = await api.get("/v1/government-updates");
    return response.data;
  }
};
