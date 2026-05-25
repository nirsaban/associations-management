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
 * Returns true when the named flag is NOT explicitly disabled.
 * Default behaviour is ON; set the env var to 'off', 'false', or '0' (case-insensitive)
 * to disable.
 */
export function isFeatureEnabled(flagName: string): boolean {
  const value = process.env[flagName];
  if (!value) return true;
  return !['off', 'false', '0'].includes(value.toLowerCase());
}
