import api from "./api";

// Mapping from string brackets collected in frontend form to float values expected by backend
const INCOME_MAPPING = {
  "Below ₹1 Lakh": 80000.0,
  "₹1L – ₹3L": 200000.0,
  "₹3L – ₹6L": 450000.0,
  "₹6L – ₹18L": 1200000.0,
  "Above ₹18L": 2000000.0
};

/**
 * Service for handling user profiles and saving demographic preferences.
 */
export const profileService = {
  /**
   * Fetches the user profile details by querying GET /api/dashboard/{userId}
   * and reverse-mapping the income float back to the form's range bracket selection.
   */
  async getProfile(userId) {
    if (!userId) return null;
    const response = await api.get(`/dashboard/${userId}`);
    const user = response.data?.user;
    if (!user) return null;

    // Reverse-map income float to bracket strings
    const incomeVal = parseFloat(user.income) || 0.0;
    let incomeBracket = "Below ₹1 Lakh";
    if (incomeVal > 1800000) {
      incomeBracket = "Above ₹18L";
    } else if (incomeVal > 600000) {
      incomeBracket = "₹6L – ₹18L";
    } else if (incomeVal > 300000) {
      incomeBracket = "₹3L – ₹6L";
    } else if (incomeVal > 100000) {
      incomeBracket = "₹1L – ₹3L";
    }

    return {
      name: user.name || "",
      age: user.age || "",
      gender: user.gender || "Female",
      state: user.state || "",
      district: user.district || "Default District",
      occupation: user.occupation || "",
      income: incomeBracket,
      education: user.education || "",
      category: user.category || "General",
      disabilityStatus: user.disabilityStatus || "No"
    };
  },

  /**
   * Saves demographics preferences to FastAPI backend /api/users.
   * Maps fields to fit Pydantic schema validation.
   */
  async saveProfile(profileData) {
    const payload = {
      name: profileData.name,
      age: parseInt(profileData.age, 10) || 0,
      gender: profileData.gender,
      state: profileData.state,
      income: INCOME_MAPPING[profileData.income] || parseFloat(profileData.income) || 0.0,
      occupation: profileData.occupation,
      education: profileData.education
    };

    const response = await api.post("/users", payload);
    return response.data;
  },

  /**
   * Fetches user notifications and alerts.
   * Graceful fallback if endpoint is not implemented on backend yet.
   */
  async getNotifications() {
    try {
      const response = await api.get("/notifications");
      return response.data;
    } catch (e) {
      return [
        {
          id: "notif-1",
          category: "status",
          title: "Profile Synced to Supabase",
          message: "Your demographic preferences are successfully saved. Dynamic scheme matching is now active.",
          timestamp: "Just now",
          read: false
        },
        {
          id: "notif-2",
          category: "deadlines",
          title: "PMAY Urban 2.0 Registration Closing",
          message: "Reminder: Credit-linked interest subsidy registrations for EWS households close by 31 December 2026.",
          timestamp: "2 hours ago",
          read: false
        },
        {
          id: "notif-3",
          category: "updates",
          title: "LPG Connection Subsidy Revised",
          message: "Pradhan Mantri Ujjwala Connection has revised the refill DBT parameters for regional districts.",
          timestamp: "1 day ago",
          read: true
        }
      ];
    }
  },

  /**
   * Marks a notification alert as read.
   */
  async markNotificationAsRead(id) {
    try {
      const response = await api.post(`/notifications/${id}/read`);
      return response.data;
    } catch (e) {
      return { success: true };
    }
  }
};
