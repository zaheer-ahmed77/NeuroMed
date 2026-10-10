// Automatically detects whether running on localhost or network IP
// Support for production deployment via Vercel (VITE_API_BASE_URL)
const API_BASE = import.meta.env.VITE_API_BASE_URL || `/api`;
export const GOOGLE_CLIENT_ID = "965094671860-s536pihdbo40ajfcl99s8ivj0j7m2ulj.apps.googleusercontent.com";

export default API_BASE;
