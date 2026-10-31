import API from "./api";

// Student Registration
export async function registerStudent(data) {
  const response = await API.post("/auth/register", data);
  return response.data;
}

// Student Login
export async function loginStudent(credentials) {
  const response = await API.post("/auth/login", credentials);
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("student", JSON.stringify(response.data.student));
  return response.data.student;
}

// Student Logout
export function logoutStudent() {
  localStorage.removeItem("token");
  localStorage.removeItem("student");
}

// Student Session
export function getStudentSession() {
  const student = localStorage.getItem("student");
  return student ? JSON.parse(student) : null;
}

// Forgot Password Flow
export async function requestPasswordReset(contact) {
  const response = await API.post("/auth/forgot-password", { contact });
  return response.data;
}

export async function verifyOTP(contact, otp) {
  const response = await API.post("/auth/verify-otp", { contact, otp });
  return response.data;
}

export async function resetPassword(resetToken, newPassword) {
  const response = await API.post("/auth/reset-password", { resetToken, newPassword });
  return response.data;
}

// Baseline Photo Update
export async function updateBaselinePhoto(studentId, profilePhoto) {
  const response = await API.put("/auth/profile-photo", {
    student_id: studentId,
    profile_photo: profilePhoto
  });
  if (response.data && response.data.student) {
    localStorage.setItem("student", JSON.stringify(response.data.student));
  }
  return response.data;
}

// Admin
export {
  loginAdmin,
  logoutAdmin,
  getAdminSession,
} from "./adminService";

// Exam
export async function startExam(data) {
  const response = await API.post("/exam/start", data);
  return response.data;
}

export async function getQuestions(examId) {
  const response = await API.get(`/exam/questions/${examId}`);
  return response.data.questions;
}

export async function publishExam(data) {
  const response = await API.post("/exam/publish", data);
  return response.data;
}

export async function reportViolation(data) {
  const response = await API.post("/exam/violation", data);
  return response.data;
}

export async function logProctorIncident(data) {
  const response = await API.post("/proctor/incident", data);
  return response.data;
}

export async function uploadScreenshot(data) {
  const response = await API.post("/proctor/screenshot", data);
  return response.data;
}

export async function submitResult(data) {
  const response = await API.post("/result/submit", data);
  return response.data;
}

export const getAllResults = async () => {
  const response = await API.get("/result/all");
  return response.data;
};

export const getAllIncidents = async () => {
  const response = await API.get("/proctor/incidents");
  return response.data;
};

export const updateIncidentStatus = async (id, status) => {
  const response = await API.put(`/proctor/incident/${id}/status`, { status });
  return response.data;
};

export const pingLiveSession = async (data) => {
  const response = await API.post("/proctor/ping", data);
  return response.data;
};

export const getLiveSessions = async () => {
  const response = await API.get("/proctor/live");
  return response.data;
};

export const getStudentLiveFeed = async (studentId) => {
  const response = await API.get(`/proctor/live-feed/${studentId}`);
  return response.data;
};

export const endLiveSession = async (studentId) => {
  const response = await API.delete(`/proctor/live/${studentId}`);
  return response.data;
};

export const sendNotification = async (studentId, message) => {
  const response = await API.post(`/proctor/notify/${studentId}`, { message });
  return response.data;
};

export const flagLiveSession = async (studentId) => {
  const response = await API.post(`/proctor/flag/${studentId}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await API.get("/proctor/dashboard");
  return response.data;
};

export const createSession = async (data) => {
  const response = await API.post("/proctor/create-session", data);
  return response.data;
};
