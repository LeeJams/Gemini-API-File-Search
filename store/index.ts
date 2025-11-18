import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createUISlice } from "./slices/uiSlice";
import { createStoresSlice } from "./slices/storesSlice";
import { createDocumentsSlice } from "./slices/documentsSlice";
import { createQuerySlice } from "./slices/querySlice";
import type { AppStore } from "@/types/store";

/**
 * Main Application Store
 *
 * Zustand를 사용한 전역 상태 관리
 * - Slice 패턴으로 기능별 상태 분리
 * - 일부 slice에 persist middleware 적용 (localStorage)
 */
export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      // UI slice (no persistence)
      ...createUISlice(...args),

      // Stores slice (with persistence)
      ...createStoresSlice(...args),

      // Documents slice (no persistence)
      ...createDocumentsSlice(...args),

      // Query slice (with persistence)
      ...createQuerySlice(...args),
    }),
    {
      name: "gemini-file-search-storage",
      storage: createJSONStorage(() => {
        // Check if we're on the client side
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // Return a dummy storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist specific slices
      partialize: (state) => ({
        // Stores slice
        stores: state.stores,
        currentStore: state.currentStore,
        lastUpdated: state.lastUpdated,
        cacheTTL: state.cacheTTL,

        // Query slice
        history: state.history,
        maxHistorySize: state.maxHistorySize,

        // Do NOT persist:
        // - UI state (isLoading, error, etc.)
        // - Documents state (should be fetched fresh)
        // - currentResult (temporary)
      }),
    }
  )
);

/**
 * Selectors for better performance
 * Use these in components to prevent unnecessary re-renders
 */
export const useUIState = () =>
  useAppStore((state) => ({
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
    error: state.error,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  }));

export const useStoresState = () =>
  useAppStore((state) => ({
    stores: state.stores,
    currentStore: state.currentStore,
    lastUpdated: state.lastUpdated,
    setStores: state.setStores,
    setCurrentStore: state.setCurrentStore,
    addStore: state.addStore,
    removeStore: state.removeStore,
    clearStores: state.clearStores,
    isCacheValid: state.isCacheValid,
  }));

export const useDocumentsState = () =>
  useAppStore((state) => ({
    documents: state.documents,
    selectedDocuments: state.selectedDocuments,
    setDocuments: state.setDocuments,
    addDocument: state.addDocument,
    removeDocument: state.removeDocument,
    toggleSelectDocument: state.toggleSelectDocument,
    clearSelectedDocuments: state.clearSelectedDocuments,
    clearDocuments: state.clearDocuments,
  }));

export const useQueryState = () =>
  useAppStore((state) => ({
    history: state.history,
    currentResult: state.currentResult,
    addToHistory: state.addToHistory,
    setCurrentResult: state.setCurrentResult,
    clearHistory: state.clearHistory,
    clearCurrentResult: state.clearCurrentResult,
  }));
