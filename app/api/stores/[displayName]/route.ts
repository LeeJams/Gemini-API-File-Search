/**
 * Store Detail API Route
 * GET /api/stores/[displayName] - Get store details
 * DELETE /api/stores/[displayName] - Delete store
 */

import { NextRequest, NextResponse } from "next/server";
import {
  findStoreByDisplayName,
  deleteFileSearchStore,
} from "@/lib/gemini";
import type { ApiResponse } from "@/types";

/**
 * GET /api/stores/[displayName]
 * Get specific store details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string }> }
) {
  try {
    const { displayName } = await params;

    const store = await findStoreByDisplayName(displayName);

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

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "스토어 조회 중 오류가 발생했습니다",
      },
      { status: 404 }
    );
  }
}

/**
 * DELETE /api/stores/[displayName]
 * Delete a store
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string }> }
) {
  try {
    const { displayName } = await params;

    const store = await findStoreByDisplayName(displayName);
    await deleteFileSearchStore(store);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "스토어가 삭제되었습니다",
    });
  } catch (error: any) {
    console.error("스토어 삭제 오류:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "스토어 삭제 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
