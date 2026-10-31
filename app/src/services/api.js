import axios from "axios";

let baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
baseURL = baseURL.replace(/\/+$/, "");
if (!baseURL.endsWith("/api")) {
  baseURL += "/api";
}

export const SERVER_BASE_URL = baseURL.replace(/\/api\/?$/, "");

export const getUploadUrl = (relativePath) => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) return relativePath;
  const cleanPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

const API = axios.create({
  baseURL,
});

export default API;
