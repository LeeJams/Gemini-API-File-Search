/**
 * Document API Route
 * DELETE /api/stores/[displayName]/documents/[documentName] - Delete document
 */

import { NextRequest, NextResponse } from "next/server";
import { findStoreByDisplayName, listDocuments, deleteDocument } from "@/lib/gemini";
import type { ApiResponse } from "@/types";

/**
 * DELETE /api/stores/[displayName]/documents/[documentName]
 * Delete a specific document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string; documentName: string }> }
) {
  try {
    const { displayName, documentName } = await params;

    // Find store
    const store = await findStoreByDisplayName(displayName);

    // List all documents in the store
    const documents = await listDocuments(store);

    // Find the document by name
    const document = documents.find((doc) => doc.name === documentName);

    if (!document) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "문서를 찾을 수 없습니다",
        },
        { status: 404 }
      );
    }

    // Delete the document
    await deleteDocument(document);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "문서가 삭제되었습니다",
    });
  } catch (error: any) {
    console.error("문서 삭제 오류:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "문서 삭제 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
