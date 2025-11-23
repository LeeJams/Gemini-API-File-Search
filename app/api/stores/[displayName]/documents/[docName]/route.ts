import { NextRequest, NextResponse } from "next/server";
import {
  findStoreByDisplayName,
  findDocumentByDisplayName,
  deleteDocument,
} from "@/lib/gemini";

/**
 * DELETE /api/stores/:displayName/documents/:docName
 *
 * 문서 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string; docName: string }> }
) {
  try {
    const { displayName, docName } = await params;

    console.log(`\n🗑️  문서 삭제 요청: ${decodeURIComponent(docName)}`);

    const apiKey = request.headers.get("x-api-key") || undefined;

    // 스토어 검색
    const fileStore = await findStoreByDisplayName(
      decodeURIComponent(displayName),
      apiKey
    );

    if (!fileStore) {
      return NextResponse.json(
        {
          success: false,
          error: "스토어를 찾을 수 없습니다",
        },
        { status: 404 }
      );
    }

    // 문서 검색
    const document = await findDocumentByDisplayName(
      fileStore,
      decodeURIComponent(docName)
    );

    // 문서 삭제
    await deleteDocument(document);

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
        errorMessage = "API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.";
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
