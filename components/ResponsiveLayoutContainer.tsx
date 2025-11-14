import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

/**
 * Conditionally renders mobile or web UI based on current breakpoint.
 * Mobile‑first: < 1024 px → mobile, ≥ 1024 px → web.
 */
export const ResponsiveLayoutContainer: React.FC<{
  webUI: React.ReactNode;
  mobileUI: React.ReactNode;
}> = ({ webUI, mobileUI }) => {
  const { xl } = useBreakpoint();
  const isMobile = !xl; // < 1024 px

  // Conditional rendering preserves component lifecycles
  return isMobile ? mobileUI : webUI;
};