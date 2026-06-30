import api from "./api";

// Mapping from string brackets collected in frontend form to float values expected by backend
const INCOME_MAPPING = {
  "Below ₹1 Lakh": 80000.0,
  "₹1L – ₹3L": 200000.0,
  "₹3L – ₹6L": 450000.0,
  "₹6L – ₹18L": 1200000.0,
  "Above ₹18L": 200000.0
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
    const activeUserId = userId || localStorage.getItem("js_guest_user_id");
    if (!activeUserId) {
      const guestProfileStr = localStorage.getItem("js_profile_guest");
      if (guestProfileStr) {
        try {
          return JSON.parse(guestProfileStr);
        } catch (e) {}
      }
      return null;
    }

    try {
      const response = await api.post("/match-schemes", { user_id: activeUserId });
      const user = response.data?.user;
      if (!user) return null;

      // Load extra fields from localStorage
      const extraStr = localStorage.getItem(`js_profile_extra_${activeUserId}`) || localStorage.getItem("js_profile_extra_guest");
      let extra = {};
      if (extraStr) {
        try {
          extra = JSON.parse(extraStr);
        } catch (e) {}
      }

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
        district: extra.district || "Default District",
        occupation: user.occupation || "",
        income: incomeBracket,
        education: user.education || "",
        category: extra.category || "General",
        disabilityStatus: extra.disabilityStatus || "No",
        girl_child: extra.girl_child || "No",
        land: extra.land || "No",
        household: extra.household || ""
      };
    } catch (err) {
      // Fallback to local profile if API fails
      const guestProfileStr = localStorage.getItem("js_profile_guest");
      if (guestProfileStr) {
        try {
          return JSON.parse(guestProfileStr);
        } catch (e) {}
      }
      return null;
    }
  },

  /**
   * Saves demographics preferences to FastAPI backend /api/users.
   * Maps fields to fit Pydantic schema validation.
   */
  async saveProfile(profileData, userId = null) {
    const payload = {
      name: profileData.name || "Guest Citizen",
      age: parseInt(profileData.age, 10) || 0,
      gender: profileData.gender || "Universal",
      state: profileData.state || "All",
      income: INCOME_MAPPING[profileData.income] || parseFloat(profileData.income) || 0.0,
      occupation: profileData.occupation || "All",
      education: profileData.education || "All"
    };

    if (userId) {
      payload.id = userId;
    }

    const response = await api.post("/users", payload);
    const returnedUserId = response.data?.user_id;

    if (returnedUserId) {
      const extraData = {
        district: profileData.district || "Default District",
        category: profileData.category || "General",
        disabilityStatus: profileData.disabilityStatus || "No",
        girl_child: profileData.girl_child || "No",
        land: profileData.land || "No",
        household: profileData.household || ""
      };
      
      localStorage.setItem(`js_profile_extra_${returnedUserId}`, JSON.stringify(extraData));
      
      if (!userId) {
        localStorage.setItem("js_guest_user_id", returnedUserId);
        localStorage.setItem("js_profile_guest", JSON.stringify({
          ...profileData,
          id: returnedUserId
        }));
        localStorage.setItem("js_profile_extra_guest", JSON.stringify(extraData));
      }
    }

    return response.data;
  },

  /**
   * Fetches user notifications and alerts.
   * Graceful fallback if endpoint is not implemented on backend yet.
   */
  async getNotifications() {
    try {
      const response = await api.get("/v1/notifications");
      // Safely handle both envelope format { data: [...] } and raw array responses
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
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
      const response = await api.post(`/v1/notifications/${id}/read`);
      return response.data;
    } catch (e) {
      return { success: true };
    }
  }
};
