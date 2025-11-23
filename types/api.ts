/**
 * API Type Definitions
 *
 * API 요청/응답에 사용되는 타입 정의
 */

import type {
  FileSearchStore,
  FileSearchDocument,
  QueryResponse,
} from "./gemini";

/**
 * Standard API Response
 * 모든 API 엔드포인트의 기본 응답 형식
 */
export interface ApiResponse<T = any> {
  /** 성공 여부 */
  success: boolean;
  /** 응답 메시지 (옵션) */
  message?: string;
  /** 응답 데이터 (성공 시) */
  data?: T;
  /** 에러 메시지 (실패 시) */
  error?: string;
  /** 에러 코드 (실패 시) */
  code?: number;
}

/**
 * Create Store Request
 */
export interface CreateStoreRequest {
  displayName: string;
}

/**
 * Create Store Response
 */
export interface CreateStoreResponse {
  name: string;
  displayName: string;
}

/**
 * List Stores Response
 */
export interface ListStoresResponse {
  data: FileSearchStore[];
  count: number;
}

/**
 * Query Request
 */
export interface QueryRequest {
  query: string;
  metadataFilter?: string | null;
  model?: string;
}

/**
 * Query Response Data
 */
export interface QueryResponseData {
  text: string;
  groundingMetadata: QueryResponse["groundingMetadata"];
}

/**
 * Upload File Response Item
 */
export interface UploadFileResult {
  /** 파일명 */
  fileName: string;
  /** 성공 여부 */
  success: boolean;
  /** 에러 메시지 (실패 시) */
  error?: string;
  /** 문서 정보 (성공 시) */
  document?: FileSearchDocument;
}

/**
 * Upload Files Response
 */
export interface UploadFilesResponse {
  results: UploadFileResult[];
  successCount: number;
  failCount: number;
}

/**
 * List Documents Response
 */
export interface ListDocumentsResponse {
  data: FileSearchDocument[];
  count: number;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: number;
}

/**
 * Type guard for ApiResponse
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard for ErrorResponse
 */
export function isErrorResponse(
  response: ApiResponse
): response is ErrorResponse {
  return response.success === false;
}
