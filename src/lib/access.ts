export const SUPPORT_WHATSAPP_NUMBER = "8851844602";
export const SUBSCRIPTION_PRICE_RUPEES = 50;

export interface AccessProfile {
  is_admin?: boolean | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  renewal_whatsapp?: string | null;
  plan_price?: number | null;
}

const isFutureDate = (value?: string | null) => {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
};

export const isAdminUser = (profile: AccessProfile | null | undefined) => Boolean(profile?.is_admin);

export const isSubscriptionActive = (profile: AccessProfile | null | undefined) => {
  if (!profile) return false;
  if (isAdminUser(profile)) return true;

  const status = (profile.subscription_status || "inactive").toLowerCase();
  if (["active", "trial", "lifetime"].includes(status)) return true;
  if (status === "expired" || status === "inactive" || status === "suspended") return false;
  return isFutureDate(profile.subscription_expires_at);
};

export const hasAppAccess = (profile: AccessProfile | null | undefined) =>
  isAdminUser(profile) || isSubscriptionActive(profile);

export const getWhatsAppLink = (message: string) =>
  `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;