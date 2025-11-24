/**
 * Store Detail API Route
 * GET /api/stores/[storeId] - Get store details
 * DELETE /api/stores/[storeId] - Delete store
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteFileSearchStore } from "@/lib/gemini";
import type { ApiResponse, FileSearchStore } from "@/types";

/**
 * GET /api/stores/[storeId]
 * Get specific store details
 */
export async function GET(
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

    // ID만 가지고 있으므로 displayName은 클라이언트에서 관리
    const store: FileSearchStore = {
      name: storeId,
      displayName: storeId, // 실제 displayName은 클라이언트에서 관리
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        name: store.name,
        displayName: store.displayName,
        createTime: store.createTime,
        updateTime: store.updateTime,
      },
    });
  } catch (error: any) {
    console.error("스토어 조회 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status =
      error.status ||
      error.statusCode ||
      (error.message?.includes("찾을 수 없습니다") ? 404 : 500);
    let errorMessage = error.message || "스토어 조회 중 오류가 발생했습니다";

    switch (status) {
      case 401:
        errorMessage = "API 키가 유효하지 않습니다.";
        break;
      case 403:
        errorMessage =
          "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;
      case 404:
        // Keep the original error message for 404
        break;
      case 429:
        errorMessage =
          "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        break;
      case 503:
        errorMessage =
          "Google AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.";
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
 * DELETE /api/stores/[storeId]
 * Delete a store
 */
export async function DELETE(
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

    const store: FileSearchStore = {
      name: storeId,
      displayName: storeId,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };

    await deleteFileSearchStore(store, apiKey);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "스토어가 삭제되었습니다",
    });
  } catch (error: any) {
    console.error("스토어 삭제 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status =
      error.status ||
      error.statusCode ||
      (error.message?.includes("찾을 수 없습니다") ? 404 : 500);
    let errorMessage = error.message || "스토어 삭제 중 오류가 발생했습니다";

    switch (status) {
      case 401:
        errorMessage = "API 키가 유효하지 않습니다.";
        break;
      case 403:
        errorMessage =
          "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;
      case 404:
        // Keep the original error message for 404
        break;
      case 429:
        errorMessage =
          "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        break;
      case 503:
        errorMessage =
          "Google AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.";
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
