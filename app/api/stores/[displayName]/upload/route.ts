/**
 * Upload API Route
 * POST /api/stores/[displayName]/upload - Upload files to store
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import {
  findStoreByDisplayName,
  uploadWithCustomChunking,
} from "@/lib/gemini";
import type { ApiResponse, UploadFileResult } from "@/types";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

/**
 * POST /api/stores/[displayName]/upload
 * Upload multiple files to store
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ displayName: string }> }
) {
  try {
    const { displayName } = await params;

    // Ensure uploads directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Parse FormData
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "파일이 없습니다",
        },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `최대 ${MAX_FILES}개의 파일만 업로드 가능합니다`,
        },
        { status: 400 }
      );
    }

    // Find store
    const store = await findStoreByDisplayName(displayName);

    // Process files
    const results: UploadFileResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          results.push({
            fileName: file.name,
            success: false,
            error: `파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다`,
          });
          failCount++;
          continue;
        }

        // Save file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tempFilePath = path.join(
          UPLOAD_DIR,
          `${Date.now()}-${file.name}`
        );

        await writeFile(tempFilePath, buffer);

        try {
          // Upload to Gemini
          await uploadWithCustomChunking(store, tempFilePath, {
            displayName: file.name,
          });

          results.push({
            fileName: file.name,
            success: true,
          });

          successCount++;
        } finally {
          // Clean up temp file
          if (existsSync(tempFilePath)) {
            await unlink(tempFilePath);
          }
        }
      } catch (error: any) {
        console.error(`파일 업로드 오류 (${file.name}):`, error);
        results.push({
          fileName: file.name,
          success: false,
          error: error.message || "업로드 중 오류가 발생했습니다",
        });
        failCount++;
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${successCount}개 성공, ${failCount}개 실패`,
      data: {
        results,
        successCount,
        failCount,
      },
    });
  } catch (error: any) {
    console.error("파일 업로드 오류:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message || "파일 업로드 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

// Set max file size for Next.js body parser
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
