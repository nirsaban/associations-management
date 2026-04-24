/**
 * Motion utilities for landing page animations.
 * All animations respect prefers-reduced-motion globally.
 */

import { Variants } from 'framer-motion';

// ─── Easing ──────────────────────────────────────────────────────
export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

// ─── Entrance animation variants ────────────────────────────────
// 24px Y-offset + opacity 0→1, 600ms, soft easeOutExpo
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

// ─── Stagger container ──────────────────────────────────────────
// Stagger children by 70ms (midpoint of 60–90ms range)
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

// ─── Interactive states ─────────────────────────────────────────
// Hover on cards: 1.02 scale + shadow lift, 150ms
export const cardHover = {
  scale: 1.02,
  transition: { duration: 0.15 },
};

// CTA press: scale 0.98, no bounce
export const ctaTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// ─── Viewport trigger defaults ──────────────────────────────────
export const viewportOnce = {
  once: true,
  amount: 0.15 as const,
  margin: '-40px' as const,
};
