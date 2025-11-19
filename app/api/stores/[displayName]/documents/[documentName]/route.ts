/**
 * 문서 상세 조회 API
 * GET /api/stores/[displayName]/documents/[documentName]
 */

import { NextRequest, NextResponse } from "next/server";
import { findStoreByDisplayName, findDocumentByDisplayName } from "@/lib/gemini";
import type { ApiResponse, FileSearchDocument } from "@/types";

/**
 * 특정 문서의 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string; documentName: string }> }
) {
  try {
    const { displayName, documentName } = await params;

    console.log(`\n📄 문서 상세 조회 요청: ${displayName}/${documentName}`);

    // 1. 스토어 찾기
    const store = await findStoreByDisplayName(displayName);

    // 2. 문서 찾기
    const document = await findDocumentByDisplayName(store, documentName);

    console.log(`✅ 문서 조회 완료: ${document.name}`);

    return NextResponse.json<ApiResponse<FileSearchDocument>>({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error("❌ 문서 조회 실패:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "문서 조회에 실패했습니다",
        code: error.status || 500,
      },
      { status: error.status || 500 }
    );
  }
}
