/**
 * Query API Route
 * POST /api/stores/[storeId]/query - Execute RAG query
 */

import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFileSearch } from "@/lib/gemini";
import type { ApiResponse, QueryRequest, FileSearchStore } from "@/types";

/**
 * POST /api/stores/[storeId]/query
 * Execute RAG query on store
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "API 키가 필요합니다. x-api-key 헤더를 포함해주세요.",
        },
        { status: 401 }
      );
    }

    const { storeId } = await params;
    const body: QueryRequest = await request.json();
    const {
      query,
      metadataFilter,
      model,
      systemInstruction,
      generationConfig,
      safetySettings,
    } = body;

    if (!query || !query.trim()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "query가 필요합니다",
        },
        { status: 400 }
      );
    }

    const store: FileSearchStore = {
      name: storeId,
      displayName: storeId,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };

    const response = await generateContentWithFileSearch(
      store,
      query.trim(),
      apiKey,
      metadataFilter || null,
      model || "gemini-2.5-flash",
      systemInstruction,
      generationConfig,
      safetySettings
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        text: response.text,
        groundingMetadata: response.groundingMetadata || null,
      },
    });
  } catch (error: any) {
    console.error("쿼리 실행 오류:", error);

    // API 에러 코드별 처리
    const status = error.status || error.statusCode || 500;
    let errorMessage =
      error.message || "쿼리 실행 중 알 수 없는 오류가 발생했습니다";
    let statusCode = 500;

    switch (status) {
      case 400:
        statusCode = 400;
        errorMessage = `잘못된 요청입니다: ${error.message}`;
        break;
      case 403:
        statusCode = 403;
        errorMessage =
          "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;
      case 404:
        statusCode = 404;
        errorMessage = `리소스를 찾을 수 없습니다: ${error.message}`;
        break;
      case 429:
        statusCode = 429;
        errorMessage =
          "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        break;
      case 500:
        statusCode = 500;
        errorMessage = `서버 오류가 발생했습니다: ${error.message}`;
        break;
      case 503:
        statusCode = 503;
        errorMessage =
          "현재 Gemini 모델이 과부하 상태입니다. 잠시 후 다시 시도해주세요.";
        break;
      default:
        statusCode = 500;
        errorMessage = error.message || "알 수 없는 오류가 발생했습니다";
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: errorMessage,
        code: status,
      },
      { status: statusCode }
    );
  }
}
