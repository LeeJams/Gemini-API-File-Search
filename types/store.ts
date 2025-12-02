/**
 * Store (Zustand) Type Definitions
 *
 * Zustand 상태 관리에 사용되는 타입 정의
 */

import type { FileSearchStore, FileSearchDocument } from "./gemini";

/**
 * UI State Slice
 * 전역 UI 상태 관리
 */
export interface UIState {
  /** 로딩 상태 */
  isLoading: boolean;
  /** 로딩 메시지 */
  loadingMessage?: string;
  /** 에러 메시지 */
  error: string | null;

  /** Actions */
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Stores State Slice
 * File Search Stores 상태 관리
 */
export interface StoresState {
  /** 스토어 목록 */
  stores: FileSearchStore[];
  /** 현재 선택된 스토어 */
  currentStore: FileSearchStore | null;
  /** 마지막 업데이트 시간 */
  lastUpdated: number | null;
  /** 캐시 만료 시간 (5분) */
  cacheTTL: number;

  /** Actions */
  setStores: (stores: FileSearchStore[]) => void;
  setCurrentStore: (store: FileSearchStore | null) => void;
  addStore: (store: FileSearchStore) => void;
  removeStore: (displayName: string) => void;
  clearStores: () => void;
  isCacheValid: () => boolean;
}

/**
 * Documents State Slice
 * 문서 상태 관리
 */
export interface DocumentsState {
  /** 현재 스토어의 문서 목록 */
  documents: FileSearchDocument[];
  /** 선택된 문서들 */
  selectedDocuments: string[];
  /** 마지막 업데이트 시간 */
  lastUpdated: number | null;

  /** Actions */
  setDocuments: (documents: FileSearchDocument[]) => void;
  addDocument: (document: FileSearchDocument) => void;
  removeDocument: (documentName: string) => void;
  toggleSelectDocument: (documentName: string) => void;
  clearSelectedDocuments: () => void;
  clearDocuments: () => void;
}

/**
 * Query State Slice
 * RAG 쿼리 상태 관리
 */
export interface QueryState {
  /** 쿼리 히스토리 */
  history: QueryHistoryItem[];
  /** 현재 쿼리 결과 */
  currentResult: QueryResult | null;
  /** 최대 히스토리 개수 */
  maxHistorySize: number;

  /** Actions */
  addToHistory: (item: QueryHistoryItem) => void;
  setCurrentResult: (result: QueryResult | null) => void;
  clearHistory: () => void;
  clearCurrentResult: () => void;
}

/**
 * Query History Item
 */
export interface QueryHistoryItem {
  /** 고유 ID */
  id: string;
  /** 쿼리 텍스트 */
  query: string;
  /** 응답 텍스트 */
  response: string;
  /** 타임스탬프 */
  timestamp: number;
  /** 스토어 이름 */
  storeName: string;
}

/**
 * Query Result
 */
export interface QueryResult {
  /** 응답 텍스트 */
  text: string;
  /** 그라운딩 메타데이터 */
  groundingMetadata: any;
  /** 타임스탬프 */
  timestamp: number;
}

/**
 * API Key State Slice
 * API 키 상태 관리
 */
export interface ApiKeyState {
  /** API 키 */
  apiKey: string | null;

  /** Actions */
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: () => boolean;
}

/**
 * Model State Slice
 * Gemini 모델 선택 상태 관리
 */
export interface ModelState {
  /** 선택된 모델 */
  selectedModel: string;

  /** Actions */
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
 * Hydration State
 * Zustand persist 미들웨어의 hydration 상태 추적
 */
export interface HydrationState {
  /** Hydration 완료 여부 */
  _hasHydrated: boolean;

  /** Actions */
  setHasHydrated: (state: boolean) => void;
}

/**
 * Combined App Store
 * 전체 애플리케이션 상태
 */
export type AppStore = UIState &
  StoresState &
  DocumentsState &
  QueryState &
  ApiKeyState &
  ModelState &
  HydrationState;
