// Automatically detects whether running on localhost or network IP
// Support for production deployment via Vercel (VITE_API_BASE_URL)
const API_BASE = import.meta.env.VITE_API_BASE_URL || `/api`;
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_live_Y2xlcmsubmV1cm8tbWVkLW5pbmUudmVyY2VsLmFwcCQ";

export default API_BASE;
