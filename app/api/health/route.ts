/**
 * Health Check API Route
 * GET /api/health
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Gemini File Search API 서버가 실행 중입니다",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
}
