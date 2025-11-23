/**
 * Gemini API Type Definitions
 *
 * Gemini API와 상호작용하는데 필요한 타입 정의
 */

/**
 * File Search Store
 * Gemini API에서 관리하는 파일 검색 스토어
 */
export interface FileSearchStore {
  /** Store의 고유 식별자 (예: fileSearchStores/abc123) */
  name: string;
  /** 사용자가 지정한 표시 이름 */
  displayName: string;
  /** 생성 시각 */
  createTime: string;
  /** 마지막 업데이트 시각 */
  updateTime: string;
}

/**
 * Document in File Search Store
 * 스토어에 업로드된 개별 문서
 */
export interface FileSearchDocument {
  /** 문서의 고유 식별자 */
  name: string;
  /** 문서의 표시 이름 */
  displayName: string;
  /** 생성 시각 */
  createTime: string;
  /** 업데이트 시각 */
  updateTime: string;
  /** 메타데이터 (옵션) */
  metadata?: Record<string, string>;
  /** MIME 타입 */
  mimeType?: string;
  /** 파일 크기 (바이트) */
  sizeBytes?: number;
}

/**
 * Grounding Metadata
 * AI 응답의 출처 정보 (인용)
 */
export interface GroundingMetadata {
  /** 검색된 청크들 */
  groundingChunks?: GroundingChunk[];
  /** 그라운딩 지원 정보 */
  groundingSupports?: GroundingSupport[];
  /** 검색 쿼리들 */
  searchQueries?: string[];
}

/**
 * Grounding Chunk
 * 검색된 문서 청크
 */
export interface GroundingChunk {
  /** 청크 인덱스 */
  chunkIndex?: number;
  /** 청크 내용 */
  content?: string;
  /** 소스 문서 */
  source?: {
    /** 문서 이름 */
    name?: string;
    /** 문서 표시 이름 */
    displayName?: string;
  };
}

/**
 * Grounding Support
 * 응답의 특정 부분이 어떤 청크에서 왔는지 매핑
 */
export interface GroundingSupport {
  /** 지원하는 청크 인덱스들 */
  chunkIndices?: number[];
  /** 응답 텍스트의 시작 인덱스 */
  startIndex?: number;
  /** 응답 텍스트의 종료 인덱스 */
  endIndex?: number;
  /** 신뢰도 점수 */
  confidenceScore?: number;
}

/**
 * Query Response
 * RAG 쿼리의 응답
 */
export interface QueryResponse {
  /** AI가 생성한 텍스트 */
  text: string;
  /** 그라운딩 메타데이터 (인용 정보) */
  groundingMetadata?: GroundingMetadata | null;
  /** 후보 응답들 */
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    groundingMetadata?: GroundingMetadata;
  }>;
}

/**
 * CustomMetadata Value Type
 * 커스텀 메타데이터 값 타입
 */
export type CustomMetadataValue =
  | { stringValue: string }
  | { stringListValue: { values: string[] } }
  | { numericValue: number };

/**
 * CustomMetadata
 * 사용자 지정 메타데이터 (key-value 쌍)
 */
export interface CustomMetadata {
  /** 메타데이터 키 */
  key: string;
  /** 메타데이터 값 (문자열, 문자열 리스트, 또는 숫자) */
  value?: CustomMetadataValue;
  /** 간단한 문자열 값 (UI에서 사용) */
  stringValue?: string;
  /** 문자열 리스트 값 (UI에서 사용) */
  stringListValue?: { values: string[] };
  /** 숫자 값 (UI에서 사용) */
  numericValue?: number;
}

/**
 * Upload Options
 * 파일 업로드 시 옵션
 */
export interface UploadOptions {
  /** 파일 표시 이름 */
  displayName?: string;
  /** 커스텀 메타데이터 (최대 20개) */
  customMetadata?: CustomMetadata[];
  /** 청크당 최대 토큰 수 */
  maxTokensPerChunk?: number;
  /** 청크 간 겹치는 최대 토큰 수 */
  maxOverlapTokens?: number;
  /** MIME 타입 */
  mimeType?: string;
}

/**
 * Operation Status
 * 비동기 작업의 상태
 */
export interface Operation {
  /** 작업 이름 */
  name: string;
  /** 작업 완료 여부 */
  done: boolean;
  /** 작업 결과 (완료 시) */
  response?: any;
  /** 에러 정보 (실패 시) */
  error?: {
    code: number;
    message: string;
    details?: any[];
  };
  /** 메타데이터 */
  metadata?: Record<string, any>;
}

/**
 * HarmCategory
 * 유해 콘텐츠의 카테고리
 */
export enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = "HARM_CATEGORY_UNSPECIFIED",
  HARM_CATEGORY_HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH",
  HARM_CATEGORY_SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  HARM_CATEGORY_DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT",
  HARM_CATEGORY_HARASSMENT = "HARM_CATEGORY_HARASSMENT",
  HARM_CATEGORY_CIVIC_INTEGRITY = "HARM_CATEGORY_CIVIC_INTEGRITY",
}

/**
 * HarmBlockThreshold
 * 유해 콘텐츠 차단 임계값
 */
export enum HarmBlockThreshold {
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
  BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
  BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
  BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
  BLOCK_NONE = "BLOCK_NONE",
  OFF = "OFF",
}

/**
 * SafetySetting
 * 안전 설정
 */
export interface SafetySetting {
  /** 카테고리 */
  category: HarmCategory | string;
  /** 차단 임계값 */
  threshold: HarmBlockThreshold | string;
}

/**
 * GenerationConfig
 * 모델 생성 및 출력 구성 옵션
 */
export interface GenerationConfig {
  /** 출력 생성을 중지할 문자 시퀀스 (최대 5개) */
  stopSequences?: string[];
  /** 생성된 후보 텍스트의 MIME 유형 */
  responseMimeType?: string;
  /** 생성된 후보 텍스트의 출력 스키마 */
  responseSchema?: Record<string, any>;
  /** 생성할 응답 후보 수 */
  candidateCount?: number;
  /** 응답 후보에 포함할 최대 토큰 수 */
  maxOutputTokens?: number;
  /** 출력의 무작위성 제어 (0.0~2.0) */
  temperature?: number;
  /** 샘플링 시 고려할 토큰의 최대 누적 확률 */
  topP?: number;
  /** 샘플링 시 고려할 최대 토큰 수 */
  topK?: number;
  /** 디코딩에 사용되는 시드 */
  seed?: number;
  /** 프레즌스 페널티 */
  presencePenalty?: number;
  /** 빈도 페널티 */
  frequencyPenalty?: number;
  /** logprobs 결과 내보내기 여부 */
  responseLogprobs?: boolean;
  /** 반환할 상위 logprobs 수 (0~20) */
  logprobs?: number;
}
