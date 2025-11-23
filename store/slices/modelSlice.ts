import type { StateCreator } from "zustand";
import type { AppStore } from "@/types/store";

/**
 * Model Slice
 *
 * Gemini 모델 선택을 관리하는 slice
 * - localStorage에 선택된 모델 저장
 * - 기본값: gemini-2.5-flash
 */
export interface ModelSlice {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

/**
 * File Search를 지원하는 Gemini 모델 목록
 */
export const SUPPORTED_MODELS = [
  "gemini-3-pro-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

export const createModelSlice: StateCreator<AppStore, [], [], ModelSlice> = (
  set
) => ({
  selectedModel: "gemini-2.5-flash",

  setSelectedModel: (model: string) => {
    set({ selectedModel: model });
  },
});
