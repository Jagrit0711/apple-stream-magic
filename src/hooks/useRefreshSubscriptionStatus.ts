import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { updateSubscriptionCookie, getSubscriptionFromCookies } from "@/lib/cookieManager";

/**
 * Hook to dynamically refresh subscription status via cookies
 * Re-validates subscription without requiring logout/login
 * Triggers a profile refresh that updates cookies automatically
 */
export const useRefreshSubscriptionStatus = () => {
  const { refreshProfile, profile } = useAuth();

  const refreshSubscriptionStatus = useCallback(async () => {
    // First, do a quick cookie refresh if profile exists
    if (profile) {
      // Update cookies with current profile subscription status
      updateSubscriptionCookie(profile.subscription_status, profile.subscription_expires_at);
    }

    // Then perform full profile refresh from database
    await refreshProfile();
  }, [refreshProfile, profile]);

  const getCachedSubscriptionStatus = useCallback(() => {
    return getSubscriptionFromCookies();
  }, []);

  return {
    refreshSubscriptionStatus,
    getCachedSubscriptionStatus,
  };
};
