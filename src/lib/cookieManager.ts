/**
 * Cookie Manager for dynamic subscription status checking
 * Stores and retrieves subscription status from secure cookies
 * without requiring re-authentication on page refresh
 */

const COOKIE_NAMES = {
  SUBSCRIPTION_STATUS: "apple_sub_status",
  SUBSCRIPTION_EXPIRES: "apple_sub_expires",
  IS_ADMIN: "apple_is_admin",
  RENEWAL_WHATSAPP: "apple_renewal_wa",
  PLAN_PRICE: "apple_plan_price",
  PROFILE_ID: "apple_profile_id",
  LAST_CHECKED: "apple_last_checked",
};

const COOKIE_DOMAIN = "";
const COOKIE_PATH = "/";
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Set individual cookie with secure flags
 */
const setCookie = (
  name: string,
  value: string,
  days: number = COOKIE_MAX_AGE_DAYS
) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  
  const cookieString = `${name}=${encodeURIComponent(value)}; ${expires}; path=${COOKIE_PATH}; SameSite=Lax`;
  document.cookie = cookieString;
};

/**
 * Get cookie value by name
 */
const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
};

/**
 * Delete cookie by name
 */
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${COOKIE_PATH};`;
};

/**
 * Clear all subscription-related cookies
 */
export const clearSubscriptionCookies = () => {
  Object.values(COOKIE_NAMES).forEach(deleteCookie);
};

/**
 * Store profile subscription status in cookies
 */
export const setSubscriptionCookies = (profile: {
  id: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  is_admin: boolean;
  renewal_whatsapp: string | null;
  plan_price: number | null;
}) => {
  setCookie(COOKIE_NAMES.PROFILE_ID, profile.id);
  setCookie(COOKIE_NAMES.SUBSCRIPTION_STATUS, profile.subscription_status);
  setCookie(
    COOKIE_NAMES.SUBSCRIPTION_EXPIRES,
    profile.subscription_expires_at || "null"
  );
  setCookie(COOKIE_NAMES.IS_ADMIN, String(profile.is_admin));
  setCookie(
    COOKIE_NAMES.RENEWAL_WHATSAPP,
    profile.renewal_whatsapp || "null"
  );
  setCookie(
    COOKIE_NAMES.PLAN_PRICE,
    String(profile.plan_price || 0)
  );
  setCookie(COOKIE_NAMES.LAST_CHECKED, new Date().toISOString());
};

/**
 * Retrieve subscription status from cookies
 */
export const getSubscriptionFromCookies = () => {
  const status = getCookie(COOKIE_NAMES.SUBSCRIPTION_STATUS);
  const expiresAt = getCookie(COOKIE_NAMES.SUBSCRIPTION_EXPIRES);
  const isAdmin = getCookie(COOKIE_NAMES.IS_ADMIN) === "true";
  const renewalWhatsapp = getCookie(COOKIE_NAMES.RENEWAL_WHATSAPP);
  const planPrice = getCookie(COOKIE_NAMES.PLAN_PRICE);
  const profileId = getCookie(COOKIE_NAMES.PROFILE_ID);
  const lastChecked = getCookie(COOKIE_NAMES.LAST_CHECKED);

  if (!status || !profileId) return null;

  return {
    id: profileId,
    subscription_status: status,
    subscription_expires_at: expiresAt === "null" ? null : expiresAt,
    is_admin: isAdmin,
    renewal_whatsapp: renewalWhatsapp === "null" ? null : renewalWhatsapp,
    plan_price: planPrice ? Number(planPrice) : null,
    last_checked: lastChecked,
  };
};

/**
 * Check if subscription cookies are valid
 */
export const hasValidSubscriptionCookies = (): boolean => {
  const cookies = getSubscriptionFromCookies();
  return cookies !== null;
};

/**
 * Update subscription status in cookies
 */
export const updateSubscriptionCookie = (
  status: string,
  expiresAt: string | null = null
) => {
  setCookie(COOKIE_NAMES.SUBSCRIPTION_STATUS, status);
  if (expiresAt) {
    setCookie(COOKIE_NAMES.SUBSCRIPTION_EXPIRES, expiresAt);
  }
  setCookie(COOKIE_NAMES.LAST_CHECKED, new Date().toISOString());
};

/**
 * Update admin status in cookie
 */
export const updateAdminCookie = (isAdmin: boolean) => {
  setCookie(COOKIE_NAMES.IS_ADMIN, String(isAdmin));
};
