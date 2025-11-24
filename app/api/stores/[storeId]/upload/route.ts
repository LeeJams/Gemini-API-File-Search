/**
 * Upload API Route
 * POST /api/stores/[storeId]/upload - Upload files to store
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadWithCustomChunking } from "@/lib/gemini";
import type { ApiResponse, UploadFileResult, FileSearchStore } from "@/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

/**
 * POST /api/stores/[storeId]/upload
 * Upload multiple files to store
 */
export async function POST(
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

    console.log("\n📥 파일 업로드 요청 수신", {
      storeId,
      hasApiKey: !!apiKey,
    });

    // Parse FormData
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const customMetadataStr = formData.get("customMetadata") as string | null;

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

    // Create store object
    const store: FileSearchStore = {
      name: storeId,
      displayName: storeId,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };

    // Parse custom metadata
    let customMetadata: Array<{ key: string; value: any }> = [];
    if (customMetadataStr) {
      try {
        const parsed = JSON.parse(customMetadataStr);
        // Convert to API format
        customMetadata = parsed.map((meta: any) => {
          const result: any = { key: meta.key };

          if (meta.type === "number") {
            result.numericValue = parseFloat(meta.value);
          } else if (meta.type === "stringList") {
            // Parse comma-separated values
            const values = meta.value
              .split(",")
              .map((v: string) => v.trim())
              .filter((v: string) => v);
            result.stringListValue = { values };
          } else {
            result.stringValue = meta.value;
          }

          return result;
        });
      } catch (error) {
        console.error("Failed to parse customMetadata:", error);
      }
    }

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

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`\n📤 파일 업로드 준비:`, {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        // Upload to Gemini directly using buffer
        await uploadWithCustomChunking(
          store,
          buffer,
          {
            displayName: file.name,
            mimeType: file.type,
            customMetadata:
              customMetadata.length > 0 ? customMetadata : undefined,
          },
          apiKey
        );

        console.log(`✅ 파일 업로드 완료: ${file.name}`);

        results.push({
          fileName: file.name,
          success: true,
        });

        successCount++;
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

    // 실패한 파일이 있으면 에러로 처리
    if (failCount > 0) {
      const failedFiles = results
        .filter((r) => !r.success)
        .map((r) => `• ${r.fileName}: ${r.error}`)
        .join("\n");

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `${failCount}개 파일 업로드 실패:\n\n${failedFiles}`,
          data: {
            results,
            successCount,
            failCount,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `${successCount}개 파일이 성공적으로 업로드되었습니다`,
      data: {
        results,
        successCount,
        failCount,
      },
    });
  } catch (error: any) {
    console.error("파일 업로드 오류:", error);

    // HTTP 상태 코드별 에러 처리
    const status =
      error.status ||
      error.statusCode ||
      (error.message?.includes("찾을 수 없습니다") ? 404 : 500);
    let errorMessage = error.message || "파일 업로드 중 오류가 발생했습니다";

    switch (status) {
      case 400:
        errorMessage = `잘못된 요청입니다: ${error.message}`;
        break;
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
      case 413:
        errorMessage =
          "파일 크기가 너무 큽니다. 50MB 이하의 파일만 업로드 가능합니다.";
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
