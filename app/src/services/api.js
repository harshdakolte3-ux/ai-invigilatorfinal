import axios from "axios";

let baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
baseURL = baseURL.replace(/\/+$/, "");
if (!baseURL.endsWith("/api")) {
  baseURL += "/api";
}

const API = axios.create({
  baseURL,
});

export default API;