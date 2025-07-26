"'use client';"
import './globals.css';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'DeepChat',
  description: 'A powerful AI chat application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <AppContextProvider>
            {children}
            <Toaster />
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
