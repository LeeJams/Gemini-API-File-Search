/**
 * Documents List API Route
 * GET /api/stores/[displayName]/documents - List all documents in store
 */

import { NextRequest, NextResponse } from "next/server";
import { findStoreByDisplayName, listDocuments } from "@/lib/gemini";
import type { ApiResponse } from "@/types";

/**
 * GET /api/stores/[displayName]/documents
 * List all documents in store
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string }> }
) {
  try {
    const apiKey = request.headers.get("x-api-key") || undefined;
    const { displayName } = await params;

    const store = await findStoreByDisplayName(displayName, apiKey);
    const documents = await listDocuments(store, apiKey);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        data: documents,
        count: documents.length,
      },
    });
  } catch (error: any) {
    console.error("문서 목록 조회 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status = error.status || error.statusCode || (error.message?.includes("찾을 수 없습니다") ? 404 : 500);
    let errorMessage = error.message || "문서 목록 조회 중 오류가 발생했습니다";

    switch (status) {
      case 401:
        errorMessage = "API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.";
        break;
      case 403:
        errorMessage = "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;
      case 404:
        // Keep the original error message for 404
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
