"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUIState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  File,
  Calendar,
  HardDrive,
  FileType,
  Clock,
  Tag,
  Loader2,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { FileSearchDocument } from "@/types";

/**
 * Document Detail Page
 *
 * 등록된 문서의 상세 정보 조회
 */
export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeName = decodeURIComponent(params.storeName as string);
  const documentName = decodeURIComponent(params.documentName as string);

  const { setLoading, setError, clearError, isLoading, error } = useUIState();

  const [document, setDocument] = useState<FileSearchDocument | null>(null);

  useEffect(() => {
    loadDocument();
  }, [storeName, documentName]);

  async function loadDocument() {
    setLoading(true, "문서 정보 로딩 중...");
    clearError();

    try {
      const response = await fetch(
        `/api/stores/${storeName}/documents/${encodeURIComponent(documentName)}`
      );
      const data = await response.json();

      if (data.success) {
        setDocument(data.data);
      } else {
        setError(data.error || "문서를 찾을 수 없습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    router.push(`/documents/${storeName}`);
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">문서 상세 정보</h1>
            <p className="text-muted-foreground mt-1">
              스토어: {storeName}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">문서 정보를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Details */}
      {!isLoading && document && (
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Name */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    파일명
                  </p>
                  <p className="text-lg font-semibold">{document.displayName}</p>
                </div>

                {/* File Size */}
                {document.sizeBytes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      파일 크기
                    </p>
                    <p className="text-lg">{formatFileSize(document.sizeBytes)}</p>
                  </div>
                )}

                {/* MIME Type */}
                {document.mimeType && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <FileType className="h-4 w-4" />
                      파일 타입
                    </p>
                    <p className="text-lg font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                      {document.mimeType}
                    </p>
                  </div>
                )}

                {/* Create Time */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    생성일
                  </p>
                  <p className="text-lg">{formatDate(document.createTime)}</p>
                </div>

                {/* Update Time */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    수정일
                  </p>
                  <p className="text-lg">{formatDate(document.updateTime)}</p>
                </div>
              </div>

              {/* Document Name (Internal ID) */}
              <div className="space-y-1 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">
                  문서 ID
                </p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                  {document.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  메타데이터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(document.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b last:border-b-0"
                    >
                      <span className="font-medium text-sm text-muted-foreground min-w-[150px]">
                        {key}
                      </span>
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>작업</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  문서 목록으로
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
