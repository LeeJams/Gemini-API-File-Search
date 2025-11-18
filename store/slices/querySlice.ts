import type { StateCreator } from "zustand";
import type { QueryState, AppStore } from "@/types/store";

const MAX_HISTORY_SIZE = 50;

/**
 * Query State Slice
 *
 * RAG 쿼리 상태를 관리하는 Zustand slice
 * - 쿼리 히스토리
 * - 현재 결과
 *
 * persist middleware가 적용됨
 */
export const createQuerySlice: StateCreator<
  AppStore,
  [],
  [],
  QueryState
> = (set, get) => ({
  // Initial state
  history: [],
  currentResult: null,
  maxHistorySize: MAX_HISTORY_SIZE,

  // Actions
  addToHistory: (item) =>
    set((state) => {
      const newHistory = [item, ...state.history];
      // Keep only maxHistorySize items
      if (newHistory.length > state.maxHistorySize) {
        newHistory.splice(state.maxHistorySize);
      }
      return {
        history: newHistory,
      };
    }),

  setCurrentResult: (result) =>
    set({
      currentResult: result,
    }),

  clearHistory: () =>
    set({
      history: [],
    }),

  clearCurrentResult: () =>
    set({
      currentResult: null,
    }),
});
