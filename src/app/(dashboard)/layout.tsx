
import React from 'react';

// This layout applies to all routes within the (dashboard) group.
// The main AppSidebar and page structure are handled by the root layout (src/app/layout.tsx).
// This component simply ensures that if Next.js looks for a layout for this segment,
// it finds a valid React component that passes its children through.
export default function DashboardSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
