import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "https://jansahay-ui.preview.emergentagent.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
