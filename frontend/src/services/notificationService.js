import api from "./api";

/**
 * Service for interfacing with Backend Notification API operations (V1.5).
 */
export const notificationService = {
  /**
   * Fetch active list of notifications.
   */
  async getNotifications() {
    const response = await api.get("/v1/notifications");
    return response.data;
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id) {
    const response = await api.post(`/v1/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead() {
    const response = await api.post("/v1/notifications/read-all");
    return response.data;
  },

  /**
   * Deletes a single notification record.
   */
  async deleteNotification(id) {
    const response = await api.delete(`/v1/notifications/${id}`);
    return response.data;
  },

  /**
   * Clears all notifications.
   */
  async clearAll() {
    const response = await api.delete("/v1/notifications");
    return response.data;
  }
};
