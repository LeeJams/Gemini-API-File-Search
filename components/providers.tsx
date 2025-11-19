"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * App Providers
 *
 * 전역 Provider들을 통합하는 컴포넌트
 * - Theme Provider (다크모드 지원)
 * - 필요한 경우 추가 Provider 통합 가능
 */
export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
