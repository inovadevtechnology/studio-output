import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Studio Output - OBS Source',
  description: 'Live Stream guest video output for OBS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
