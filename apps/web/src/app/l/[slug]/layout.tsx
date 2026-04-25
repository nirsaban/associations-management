import { ReactNode } from 'react';

export const metadata = {
  robots: 'index, follow',
};

export default function LandingPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Design spec fonts: Instrument Serif (display) + Inter (body) + Heebo (Hebrew body) + Frank Ruhl Libre (Hebrew display) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Heebo:wght@400;500;700&family=Frank+Ruhl+Libre:wght@400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
