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
    const { displayName } = await params;

    const store = await findStoreByDisplayName(displayName);
    const documents = await listDocuments(store);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        data: documents,
        count: documents.length,
      },
    });
  } catch (error: any) {
    console.error("문서 목록 조회 오류:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "문서 목록 조회 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
