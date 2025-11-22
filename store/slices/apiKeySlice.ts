import type { StateCreator } from "zustand";
import type { AppStore } from "@/types/store";

/**
 * API Key Slice
 *
 * Gemini API 키를 관리하는 slice
 * - localStorage에 API 키 저장
 * - API 키 유효성 검증
 */
export interface ApiKeySlice {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: () => boolean;
}

export const createApiKeySlice: StateCreator<AppStore, [], [], ApiKeySlice> = (
  set,
  get
) => ({
  apiKey: null,

  setApiKey: (key: string) => {
    set({ apiKey: key.trim() });
  },

  clearApiKey: () => {
    set(() => ({
      // API Key
      apiKey: null,

      // UI 상태 초기화
      isLoading: false,
      loadingMessage: undefined,
      error: null,

      // Stores 상태 초기화
      stores: [],
      currentStore: null,
      lastUpdated: null,

      // Documents 상태 초기화
      documents: [],
      selectedDocuments: [],

      // Query 상태 초기화
      history: [],
      currentResult: null,
    }));
  },

  hasApiKey: () => {
    const { apiKey } = get();
    return !!apiKey && apiKey.trim().length > 0;
  },
});
