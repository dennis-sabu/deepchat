'use client';
import './globals.css';
import { Inter, Plus_Jakarta_Sans, Geist } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';
import { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>DeepChat — Ultra-Premium AI</title>
          <meta name="description" content="DeepChat: A premium AI chat experience built by Dennis Sabu" />
          <meta name="theme-color" content="#030303" />
        </head>
        <body className={`${jakarta.variable} ${inter.variable} ${geist.variable} font-sans antialiased bg-obsidian text-gray-200`}>
          <AppContextProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#0a0a0a',
                  color: '#e5e5e5',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontFamily: 'Inter Tight, sans-serif',
                },
              }}
            />
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
