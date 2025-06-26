
"use client";
import type { Metadata } from 'next'; // Keep for static metadata, but title might be dynamic
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from '@/components/layout/sidebar';
import React, { useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LOCAL_STORAGE_KEYS, DEFAULT_GENERAL_SETTINGS } from '@/lib/constants';
import type { GeneralSettings } from '@/types';

// Static metadata can remain here
// export const metadata: Metadata = {
//   title: 'Auto Sales Manager', // This will be overridden if dynamically set
//   description: 'Manage your auto sales efficiently.',
// };


// New component to apply theme
function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const [generalSettings] = useLocalStorage<GeneralSettings>(
    LOCAL_STORAGE_KEYS.GENERAL_SETTINGS,
    DEFAULT_GENERAL_SETTINGS
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    let effectiveTheme = generalSettings.theme;

    if (generalSettings.theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.add(effectiveTheme);
    
    // Update document title dynamically if needed, or manage via Next.js head in pages
    document.title = "Auto Sales Manager"; // Example, could be more dynamic

  }, [generalSettings.theme]);

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dynamic title will be handled by ThemeApplicator or individual pages */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground">
        <ThemeApplicator>
          <AppSidebar>
            {children}
          </AppSidebar>
          <Toaster />
        </ThemeApplicator>
      </body>
    </html>
  );
}
