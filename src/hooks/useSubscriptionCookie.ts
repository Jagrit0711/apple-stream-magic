import { useEffect, useState } from "react";
import { getSubscriptionFromCookies } from "@/lib/cookieManager";
import { isSubscriptionActive, isAdminUser } from "@/lib/access";

/**
 * Hook to check subscription status from dynamic cookies
 * Useful for fast subscription checks without waiting for full profile load
 * Returns true if subscription is active, false otherwise
 */
export const useSubscriptionCookie = () => {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const cachedData = getSubscriptionFromCookies();
    
    if (cachedData) {
      setIsAdmin(cachedData.is_admin);
      
      // Check if subscription is active
      const isActive = isSubscriptionActive(cachedData as any);
      setHasSubscription(isActive);
    }
    
    setIsChecking(false);
  }, []);

  return {
    hasSubscription,
    isAdmin,
    isChecking,
    hasAccess: hasSubscription || isAdmin,
  };
};

/**
 * Check if user has valid cookies cached
 */
export const useHasCachedProfile = () => {
  const [hasCached, setHasCached] = useState(false);

  useEffect(() => {
    const cached = getSubscriptionFromCookies();
    setHasCached(cached !== null);
  }, []);

  return hasCached;
};
