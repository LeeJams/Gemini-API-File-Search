/**
 * Stores API Route
 * GET /api/stores - List all stores
 * POST /api/stores - Create new store
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createFileSearchStore,
  listAllStores,
} from "@/lib/gemini";
import type { ApiResponse, CreateStoreRequest } from "@/types";

/**
 * GET /api/stores
 * List all File Search Stores
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key") || undefined;
    const stores = await listAllStores(apiKey);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        data: stores,
        count: stores.length,
      },
    });
  } catch (error: any) {
    console.error("스토어 목록 조회 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status = error.status || error.statusCode || 500;
    let errorMessage = error.message || "스토어 목록 조회 중 오류가 발생했습니다";

    switch (status) {
      case 401:
        errorMessage = "API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.";
        break;
      case 403:
        errorMessage = "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;
      case 429:
        errorMessage = "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        break;
      case 503:
        errorMessage = "Google AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.";
        break;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status }
    );
  }
}

/**
 * POST /api/stores
 * Create a new File Search Store
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key") || undefined;
    const body: CreateStoreRequest = await request.json();
    const { displayName } = body;

    if (!displayName || !displayName.trim()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "displayName이 필요합니다",
        },
        { status: 400 }
      );
    }

    const store = await createFileSearchStore(displayName.trim(), apiKey);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "스토어가 생성되었습니다",
      data: {
        name: store.name,
        displayName: store.displayName,
      },
    });
  } catch (error: any) {
    console.error("스토어 생성 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status = error.status || error.statusCode || 500;
    let errorMessage = error.message || "스토어 생성 중 오류가 발생했습니다";

    switch (status) {
      case 400:
        errorMessage = `잘못된 요청입니다: ${error.message}`;
        break;
      case 401:
        errorMessage = "API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.";
        break;
      case 403:
        errorMessage = "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;
      case 429:
        errorMessage = "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        break;
      case 503:
        errorMessage = "Google AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.";
        break;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status }
    );
  }
}
