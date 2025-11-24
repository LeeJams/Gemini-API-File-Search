import { NextRequest, NextResponse } from "next/server";
import { findDocumentByDisplayName, deleteDocument } from "@/lib/gemini";
import type { FileSearchStore } from "@/types";

/**
 * DELETE /api/stores/:storeId/documents/:docName
 *
 * 문서 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; docName: string }> }
) {
  try {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API 키가 필요합니다. x-api-key 헤더를 포함해주세요.",
        },
        { status: 401 }
      );
    }

    const { storeId, docName } = await params;

    console.log(`\n🗑️  문서 삭제 요청: ${decodeURIComponent(docName)}`);

    // 스토어 객체 생성
    const fileStore: FileSearchStore = {
      name: storeId,
      displayName: storeId,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };

    // 문서 검색
    const document = await findDocumentByDisplayName(
      fileStore,
      decodeURIComponent(docName),
      apiKey
    );

    // 문서 삭제
    await deleteDocument(document, apiKey);

    console.log(`✅ 문서 삭제 완료`);

    return NextResponse.json({
      success: true,
      message: "문서가 성공적으로 삭제되었습니다",
    });
  } catch (error: any) {
    console.error("문서 삭제 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status =
      error.status ||
      error.statusCode ||
      (error.message?.includes("찾을 수 없습니다") ? 404 : 500);
    let errorMessage = error.message || "문서 삭제 중 오류가 발생했습니다";

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

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status }
    );
  }
}
