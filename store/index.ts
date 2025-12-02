import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createUISlice } from "./slices/uiSlice";
import { createStoresSlice } from "./slices/storesSlice";
import { createDocumentsSlice } from "./slices/documentsSlice";
import { createQuerySlice } from "./slices/querySlice";
import { createApiKeySlice } from "./slices/apiKeySlice";
import { createModelSlice } from "./slices/modelSlice";
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

      // API Key slice (with persistence)
      ...createApiKeySlice(...args),

      // Model slice (with persistence)
      ...createModelSlice(...args),

      // Hydration state (not persisted)
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        args[0]({ _hasHydrated: state });
      },
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

        // API Key slice
        apiKey: state.apiKey,

        // Model slice
        selectedModel: state.selectedModel,

        // Do NOT persist:
        // - UI state (isLoading, error, etc.)
        // - Documents state (should be fetched fresh)
        // - currentResult (temporary)
        // - _hasHydrated (hydration state)
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Selectors for better performance
 * Use these in components to prevent unnecessary re-renders
 */
export const useUIState = () => {
  const isLoading = useAppStore((state) => state.isLoading);
  const loadingMessage = useAppStore((state) => state.loadingMessage);
  const error = useAppStore((state) => state.error);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const clearError = useAppStore((state) => state.clearError);

  return {
    isLoading,
    loadingMessage,
    error,
    setLoading,
    setError,
    clearError,
  };
};

export const useStoresState = () => {
  const stores = useAppStore((state) => state.stores);
  const currentStore = useAppStore((state) => state.currentStore);
  const lastUpdated = useAppStore((state) => state.lastUpdated);
  const setStores = useAppStore((state) => state.setStores);
  const setCurrentStore = useAppStore((state) => state.setCurrentStore);
  const addStore = useAppStore((state) => state.addStore);
  const removeStore = useAppStore((state) => state.removeStore);
  const clearStores = useAppStore((state) => state.clearStores);
  const isCacheValid = useAppStore((state) => state.isCacheValid);

  return {
    stores,
    currentStore,
    lastUpdated,
    setStores,
    setCurrentStore,
    addStore,
    removeStore,
    clearStores,
    isCacheValid,
  };
};

export const useDocumentsState = () => {
  const documents = useAppStore((state) => state.documents);
  const selectedDocuments = useAppStore((state) => state.selectedDocuments);
  const setDocuments = useAppStore((state) => state.setDocuments);
  const addDocument = useAppStore((state) => state.addDocument);
  const removeDocument = useAppStore((state) => state.removeDocument);
  const toggleSelectDocument = useAppStore(
    (state) => state.toggleSelectDocument
  );
  const clearSelectedDocuments = useAppStore(
    (state) => state.clearSelectedDocuments
  );
  const clearDocuments = useAppStore((state) => state.clearDocuments);

  return {
    documents,
    selectedDocuments,
    setDocuments,
    addDocument,
    removeDocument,
    toggleSelectDocument,
    clearSelectedDocuments,
    clearDocuments,
  };
};

export const useQueryState = () => {
  const history = useAppStore((state) => state.history);
  const currentResult = useAppStore((state) => state.currentResult);
  const addToHistory = useAppStore((state) => state.addToHistory);
  const setCurrentResult = useAppStore((state) => state.setCurrentResult);
  const clearHistory = useAppStore((state) => state.clearHistory);
  const clearCurrentResult = useAppStore((state) => state.clearCurrentResult);

  return {
    history,
    currentResult,
    addToHistory,
    setCurrentResult,
    clearHistory,
    clearCurrentResult,
  };
};

export const useModelState = () => {
  const selectedModel = useAppStore((state) => state.selectedModel);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);
  const systemInstruction = useAppStore((state) => state.systemInstruction);
  const setSystemInstruction = useAppStore((state) => state.setSystemInstruction);
  const temperature = useAppStore((state) => state.temperature);
  const setTemperature = useAppStore((state) => state.setTemperature);
  const maxOutputTokens = useAppStore((state) => state.maxOutputTokens);
  const setMaxOutputTokens = useAppStore((state) => state.setMaxOutputTokens);
  const topP = useAppStore((state) => state.topP);
  const setTopP = useAppStore((state) => state.setTopP);
  const topK = useAppStore((state) => state.topK);
  const setTopK = useAppStore((state) => state.setTopK);
  const metadataFilter = useAppStore((state) => state.metadataFilter);
  const setMetadataFilter = useAppStore((state) => state.setMetadataFilter);

  return {
    selectedModel,
    setSelectedModel,
    systemInstruction,
    setSystemInstruction,
    temperature,
    setTemperature,
    maxOutputTokens,
    setMaxOutputTokens,
    topP,
    setTopP,
    topK,
    setTopK,
    metadataFilter,
    setMetadataFilter,
  };
};
