import type { StateCreator } from "zustand";
import type { DocumentsState, AppStore } from "@/types/store";

/**
 * Documents State Slice
 *
 * 문서 상태를 관리하는 Zustand slice
 * - 문서 목록
 * - 선택된 문서
 */
export const createDocumentsSlice: StateCreator<
  AppStore,
  [],
  [],
  DocumentsState
> = (set) => ({
  // Initial state
  documents: [],
  selectedDocuments: [],
  lastUpdated: null,

  // Actions
  setDocuments: (documents) =>
    set({
      documents,
      lastUpdated: Date.now(),
    }),

  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
      lastUpdated: Date.now(),
    })),

  removeDocument: (documentName) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.name !== documentName),
      selectedDocuments: state.selectedDocuments.filter(
        (name) => name !== documentName
      ),
      lastUpdated: Date.now(),
    })),

  toggleSelectDocument: (documentName) =>
    set((state) => {
      const isSelected = state.selectedDocuments.includes(documentName);
      return {
        selectedDocuments: isSelected
          ? state.selectedDocuments.filter((name) => name !== documentName)
          : [...state.selectedDocuments, documentName],
      };
    }),

  clearSelectedDocuments: () =>
    set({
      selectedDocuments: [],
    }),

  clearDocuments: () =>
    set({
      documents: [],
      selectedDocuments: [],
      lastUpdated: null,
    }),
});
