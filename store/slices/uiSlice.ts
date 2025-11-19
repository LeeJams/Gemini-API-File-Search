import type { StateCreator } from "zustand";
import type { UIState, AppStore } from "@/types/store";

/**
 * UI State Slice
 *
 * 전역 UI 상태를 관리하는 Zustand slice
 * - 로딩 상태
 * - 에러 메시지
 */
export const createUISlice: StateCreator<
  AppStore,
  [],
  [],
  UIState
> = (set) => ({
  // Initial state
  isLoading: false,
  loadingMessage: undefined,
  error: null,

  // Actions
  setLoading: (isLoading, message) =>
    set({
      isLoading,
      loadingMessage: message,
    }),

  setError: (error) =>
    set({
      error,
    }),

  clearError: () =>
    set({
      error: null,
    }),
});
