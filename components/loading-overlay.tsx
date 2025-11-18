"use client";

import { useUIState } from "@/store";
import { cn } from "@/lib/utils";

/**
 * Loading Overlay Component
 *
 * 전역 로딩 상태를 표시하는 오버레이
 */
export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useUIState();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-background p-8 shadow-lg">
        <div className="spinner" />
        <p className="text-sm font-medium text-foreground">
          {loadingMessage || "처리 중..."}
        </p>
      </div>
    </div>
  );
}
