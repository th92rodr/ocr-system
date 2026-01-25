import type { Metadata } from 'next';

import { AuthProvider } from '@/lib/auth/auth-context';
import './globals.css';

export const metadata: Metadata = {
  authors: [{ name: 'th92rodr' }],
  title: 'OCR System',
  description: 'Upload documents, extract text with OCR, and chat with your files.',
  applicationName: 'OCR System',
  themeColor: '#030712',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' className='dark'>
      <body className='antialiased bg-gray-950 text-gray-100'>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
