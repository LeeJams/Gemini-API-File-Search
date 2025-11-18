import type { StateCreator } from "zustand";
import type { StoresState, AppStore } from "@/types/store";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Stores State Slice
 *
 * File Search Stores 상태를 관리하는 Zustand slice
 * - 스토어 목록
 * - 현재 선택된 스토어
 * - 캐시 관리
 *
 * persist middleware가 적용됨
 */
export const createStoresSlice: StateCreator<
  AppStore,
  [],
  [],
  StoresState
> = (set, get) => ({
  // Initial state
  stores: [],
  currentStore: null,
  lastUpdated: null,
  cacheTTL: CACHE_TTL,

  // Actions
  setStores: (stores) =>
    set({
      stores,
      lastUpdated: Date.now(),
    }),

  setCurrentStore: (store) =>
    set({
      currentStore: store,
    }),

  addStore: (store) =>
    set((state) => ({
      stores: [...state.stores, store],
      lastUpdated: Date.now(),
    })),

  removeStore: (displayName) =>
    set((state) => ({
      stores: state.stores.filter((s) => s.displayName !== displayName),
      currentStore:
        state.currentStore?.displayName === displayName
          ? null
          : state.currentStore,
      lastUpdated: Date.now(),
    })),

  clearStores: () =>
    set({
      stores: [],
      currentStore: null,
      lastUpdated: null,
    }),

  isCacheValid: () => {
    const { lastUpdated, cacheTTL } = get();
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < cacheTTL;
  },
});
