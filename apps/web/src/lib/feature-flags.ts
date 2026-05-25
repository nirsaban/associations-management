/**
 * Feature flags derived from environment variables.
 * All flags are evaluated at module load time (build or runtime for server components,
 * or at hydration for client components). Use NEXT_PUBLIC_ prefix for flags
 * that need to be accessible in the browser.
 */

export const COMMUNITY_PROFESSIONS_ENABLED =
  process.env.NEXT_PUBLIC_COMMUNITY_PROFESSIONS === 'on' ||
  process.env.NEXT_PUBLIC_COMMUNITY_PROFESSIONS === 'true';
