/**
 * Motion system — landing-page-design-spec.md § 4
 *
 * useEntrance() returns initial/whileInView/viewport props for Framer Motion.
 * All durations respect --dur-* tokens which collapse to 0ms under
 * prefers-reduced-motion via MotionConfig reducedMotion="user".
 */

import { Variants } from 'framer-motion';

// Easing curves from the spec
export const EASE = {
  default: [0.2, 0.7, 0.2, 1] as const,
  emphasized: [0.22, 1, 0.36, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

// Entrance-on-scroll: opacity 0→1, translateY 12→0, 280ms, emphasized
export const entranceVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE.emphasized },
  },
};

// Stagger container — 75ms per child
export const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.05,
    },
  },
};

// Viewport trigger — once, when 25% visible
export const viewportConfig = {
  once: true,
  amount: 0.25 as const,
};

// Button press — scale 0.98, 120ms, no bounce
export const pressTap = {
  scale: 0.98,
  transition: { duration: 0.12 },
};

// Hover lift — translateY -1px, 160ms
export const hoverLift = {
  y: -1,
  transition: { duration: 0.16, ease: EASE.default },
};
