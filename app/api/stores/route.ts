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
export async function GET() {
  try {
    const stores = await listAllStores();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        data: stores,
        count: stores.length,
      },
    });
  } catch (error: any) {
    console.error("스토어 목록 조회 오류:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "스토어 목록 조회 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores
 * Create a new File Search Store
 */
export async function POST(request: NextRequest) {
  try {
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

    const store = await createFileSearchStore(displayName.trim());

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

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "스토어 생성 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
