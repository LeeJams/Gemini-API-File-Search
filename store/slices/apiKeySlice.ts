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

export const createApiKeySlice: StateCreator<
  AppStore,
  [],
  [],
  ApiKeySlice
> = (set, get) => ({
  apiKey: null,

  setApiKey: (key: string) => {
    set({ apiKey: key.trim() });
  },

  clearApiKey: () => {
    set({ apiKey: null });
  },

  hasApiKey: () => {
    const { apiKey } = get();
    return !!apiKey && apiKey.trim().length > 0;
  },
});
