# Dynamic Cookie-Based Subscription Status Checking

## Overview
This implementation uses **dynamic cookies** to check subscription status on every page refresh without requiring users to log out. The subscription status is cached in cookies and automatically refreshed on page load.

## How It Works

### 1. **Automatic Cookie Management**
- When a user logs in or their profile is fetched, subscription status is **automatically stored in cookies**
- On page refresh, the cached profile loads **instantly from cookies** while the database fetches fresh data in the background
- When a user logs out, all subscription cookies are **automatically cleared**

### 2. **Key Files**

#### [`src/lib/cookieManager.ts`](src/lib/cookieManager.ts)
Core cookie management utility:
- `setSubscriptionCookies()` - Store profile subscription data in cookies
- `getSubscriptionFromCookies()` - Retrieve cached subscription status
- `updateSubscriptionCookie()` - Update subscription status dynamically
- `clearSubscriptionCookies()` - Clear all subscription cookies on logout

#### [`src/hooks/useAuth.tsx`](src/hooks/useAuth.tsx)
Enhanced AuthProvider:
- `restoreProfileFromCookies()` - Restore cached profile instantly on refresh
- Automatically sets cookies after profile fetch from database
- Clears cookies on logout

#### [`src/hooks/useSubscriptionCookie.ts`](src/hooks/useSubscriptionCookie.ts)
Hook for quick subscription checks:
- `useSubscriptionCookie()` - Check if user has active subscription from cookies
- `useHasCachedProfile()` - Check if profile is cached in cookies

#### [`src/hooks/useRefreshSubscriptionStatus.ts`](src/hooks/useRefreshSubscriptionStatus.ts)
Hook to refresh subscription status dynamically:
- `useRefreshSubscriptionStatus()` - Re-check subscription without logout

### 3. **Usage Examples**

#### Fast Subscription Check (from cookies)
```tsx
import { useSubscriptionCookie } from "@/hooks/useSubscriptionCookie";

export function MyComponent() {
  const { hasSubscription, isAdmin, isChecking, hasAccess } = useSubscriptionCookie();
  
  if (isChecking) return <div>Checking subscription...</div>;
  
  if (!hasAccess) return <div>No subscription</div>;
  
  return <div>Content available</div>;
}
```

#### Refresh Subscription Status Dynamically
```tsx
import { useRefreshSubscriptionStatus } from "@/hooks/useRefreshSubscriptionStatus";

export function SubscriptionStatus() {
  const { refreshSubscriptionStatus, getCachedSubscriptionStatus } = useRefreshSubscriptionStatus();
  
  const handleRefresh = async () => {
    // Re-check subscription without logout
    await refreshSubscriptionStatus();
    
    // Get updated cache
    const cached = getCachedSubscriptionStatus();
    console.log("Updated subscription status:", cached?.subscription_status);
  };
  
  return <button onClick={handleRefresh}>Check Status</button>;
}
```

#### Full Profile from Auth Context (with database refresh)
```tsx
import { useAuth } from "@/hooks/useAuth";

export function Profile() {
  const { profile, loading } = useAuth();
  
  // On initial load or refresh, profile is restored from cookies instantly
  // while fresh data is fetched from database in background
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Status: {profile?.subscription_status}</p>
      <p>Expires: {profile?.subscription_expires_at}</p>
    </div>
  );
}
```

## Benefits

✅ **No Log Out Required** - Subscription status checked via cookies  
✅ **Instant Profile Display** - Cached profile loads immediately on refresh  
✅ **Background Refresh** - Fresh data fetched while cookies provide instant UX  
✅ **Secure** - Uses `SameSite=Lax` cookie flags  
✅ **Auto-Cleanup** - Cookies cleared on logout  
✅ **No Manual Cookie Handling** - All managed automatically by AuthProvider  

## Cookie Details

All subscription-related cookies are stored with:
- **Domain**: Current domain (secure)
- **Path**: `/` (available across app)
- **SameSite**: `Lax` (prevents CSRF)
- **Expiration**: 30 days (auto-renewed on refresh)

Stored data:
- `apple_sub_status` - Current subscription status
- `apple_sub_expires` - Expiration date  
- `apple_is_admin` - Admin flag
- `apple_renewal_wa` - WhatsApp renewal contact
- `apple_plan_price` - Plan price
- `apple_profile_id` - Profile ID
- `apple_last_checked` - Last check timestamp

## Security Notes

- Profile is still verified against database on every page load
- Cookies serve as cache only, not source of truth
- Admin/subscription fields are protected by database triggers (see Supabase migrations)
- Users cannot modify their own subscription status via cookies
- Logout automatically clears all cookies

## Debugging

Check browser DevTools → Application → Cookies to see:
1. Which cookies are set for your domain
2. Their expiration times
3. When they're last updated

All cookies start with `apple_` prefix for easy identification.
