"use client";

import { useEffect } from "react";
import { useUIState } from "@/store";
import { X, AlertCircle } from "lucide-react";

/**
 * Loading Overlay Component
 *
 * 전역 로딩 상태 및 에러 메시지를 표시하는 오버레이
 */
export function LoadingOverlay() {
  const { isLoading, loadingMessage, error, clearError } = useUIState();

  // 에러 메시지 자동 삭제 (10초 후)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, clearError]);

  // 로딩 오버레이
  if (isLoading) {
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

  // 에러 메시지 표시 (고정 위치 - 화면 상단)
  if (error) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top-2">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 shadow-lg backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-destructive text-sm mb-1">
              오류가 발생했습니다
            </h3>
            <p className="text-sm text-destructive/90 break-words whitespace-pre-wrap">
              {error}
            </p>
          </div>
          <button
            onClick={clearError}
            className="flex-shrink-0 rounded-md p-1 hover:bg-destructive/20 transition-colors"
            aria-label="에러 메시지 닫기"
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
