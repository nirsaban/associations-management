import { ReactNode } from 'react';

export const metadata = {
  robots: 'index, follow',
};

export default function LandingPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Noto Sans Hebrew — UI UX Pro Max recommendation for Hebrew landing pages */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
