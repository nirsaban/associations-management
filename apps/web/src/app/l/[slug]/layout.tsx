import { ReactNode } from 'react';

export const metadata = {
  robots: 'index, follow',
};

export default function LandingPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Prototype fonts: Frank Ruhl Libre (display+body), David Libre, Noto Serif Hebrew, Bellefair */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;800;900&family=David+Libre:wght@400;500;700&family=Noto+Serif+Hebrew:wght@400;500;600;700;800;900&family=Bellefair&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
