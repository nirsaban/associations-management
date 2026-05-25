/**
 * Feature flags utility
 *
 * Reads environment variables to determine if a feature is enabled.
 * Supported "on" values: 'on', 'true', '1' (case-insensitive).
 */

export const FEATURE_FLAGS = {
  COMMUNITY_PROFESSIONS: 'COMMUNITY_PROFESSIONS',
} as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Returns true when the named flag is 'on', 'true', or '1' (case-insensitive).
 * Any other value (including missing) returns false.
 */
export function isFeatureEnabled(flagName: string): boolean {
  const value = process.env[flagName];
  if (!value) return false;
  return ['on', 'true', '1'].includes(value.toLowerCase());
}
