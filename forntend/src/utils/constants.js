/**
 * Application-wide Constants
 */

export const APP_NAME = "LearnSphere AI";

// Security: Use environment variable with a local fallback
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB limit
  ALLOWED_EXTENSIONS: [".pdf"],
  ALLOWED_MIME_TYPES: ["application/pdf"]
};

export const ANALYSIS_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
};

export const QUIZ_CONFIG = {
  DEFAULT_QUESTION_COUNT: 5,
  PASSING_SCORE: 70
};

export const UI_MESSAGES = {
  UPLOAD_SUCCESS: "PDF uploaded successfully. Starting AI analysis...",
  UPLOAD_ERROR: "Failed to upload file. Please check your connection.",
  AUTH_REQUIRED: "You must be logged in to access this feature.",
  GENERIC_ERROR: "Something went wrong. Please try again later."
};