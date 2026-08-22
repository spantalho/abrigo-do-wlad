/**
 * Storage keys constants
 * Format: app:v{version}:{domain}:{feature}:{identifier}
 */
export const STORAGE_KEYS = {
  FEEDBACK: {
    PAGE_VOTE: (path: string) => `app:v1:feedback:page_vote:${path}`,
  },
  UI: {
    THEME: "app:v1:ui:theme",
    INDICATORS_VISIBLE: "app:v1:ui:indicators_visible",
  },
  CACHE: {
    TTL: (key: string) => `app:v1:cache:ttl:${key}`,
  },
} as const;
