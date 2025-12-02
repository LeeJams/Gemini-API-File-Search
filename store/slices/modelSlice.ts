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

  // Advanced Options
  systemInstruction: string;
  setSystemInstruction: (instruction: string) => void;
  temperature: number | undefined;
  setTemperature: (temp: number | undefined) => void;
  maxOutputTokens: number | undefined;
  setMaxOutputTokens: (tokens: number | undefined) => void;
  topP: number | undefined;
  setTopP: (topP: number | undefined) => void;
  topK: number | undefined;
  setTopK: (topK: number | undefined) => void;
  metadataFilter: string;
  setMetadataFilter: (filter: string) => void;
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

  // Advanced Options Defaults
  systemInstruction: "",
  setSystemInstruction: (instruction: string) => set({ systemInstruction: instruction }),
  temperature: undefined,
  setTemperature: (temp: number | undefined) => set({ temperature: temp }),
  maxOutputTokens: undefined,
  setMaxOutputTokens: (tokens: number | undefined) => set({ maxOutputTokens: tokens }),
  topP: undefined,
  setTopP: (topP: number | undefined) => set({ topP: topP }),
  topK: undefined,
  setTopK: (topK: number | undefined) => set({ topK: topK }),
  metadataFilter: "",
  setMetadataFilter: (filter: string) => set({ metadataFilter: filter }),
});
