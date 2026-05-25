import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isFeatureEnabled } from '../feature-flags';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Decorator to gate an endpoint behind a feature flag.
 * When the flag is off the endpoint returns 404 — as if it does not exist.
 *
 * Usage:
 *   @FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
 *   @Get('professions')
 */
export const FeatureFlag = (flagName: string) =>
  Reflect.metadata(FEATURE_FLAG_KEY, flagName);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const flagName = this.reflector.getAllAndOverride<string | undefined>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No flag metadata — route is not gated, allow through
    if (!flagName) {
      return true;
    }

    if (!isFeatureEnabled(flagName)) {
      throw new NotFoundException();
    }

    return true;
  }
}
