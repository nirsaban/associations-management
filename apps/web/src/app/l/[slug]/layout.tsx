import { ReactNode } from 'react';

export const metadata = {
  robots: 'index, follow',
};

export default function LandingPageLayout({ children }: { children: ReactNode }) {
  // Standalone layout — no dashboard chrome, no sidebar
  return <>{children}</>;
}
