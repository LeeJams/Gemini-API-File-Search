/**
 * Type Definitions Export
 *
 * 모든 타입 정의를 중앙에서 export
 */

// Gemini API types
export type {
  FileSearchStore,
  FileSearchDocument,
  GroundingMetadata,
  GroundingChunk,
  GroundingSupport,
  QueryResponse,
  UploadOptions,
  Operation,
} from "./gemini";

// API types
export type {
  ApiResponse,
  CreateStoreRequest,
  CreateStoreResponse,
  ListStoresResponse,
  QueryRequest,
  QueryResponseData,
  UploadFileResult,
  UploadFilesResponse,
  ListDocumentsResponse,
  ErrorResponse,
} from "./api";

export { isSuccessResponse, isErrorResponse } from "./api";

// Store types
export type {
  UIState,
  StoresState,
  DocumentsState,
  QueryState,
  QueryHistoryItem,
  QueryResult,
  AppStore,
} from "./store";
