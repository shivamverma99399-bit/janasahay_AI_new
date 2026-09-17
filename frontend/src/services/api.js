import axios from "axios";

const rawUrl = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000").trim().replace(/\/+$/, "");
const baseEndpoint = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

const api = axios.create({
  baseURL: baseEndpoint,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;