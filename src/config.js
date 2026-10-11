// Automatically detects whether running on localhost or network IP
// Support for production deployment via Vercel (VITE_API_BASE_URL)
const API_BASE = import.meta.env.VITE_API_BASE_URL || `/api`;
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_Y2FwaXRhbC1nb3JpbGxhLTI1MTIuY2xlcmsuYWNjb3VudHMuZGV2JA";

export default API_BASE;
