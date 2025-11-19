"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStoresState, useDocumentsState, useUIState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  File,
  Calendar,
  HardDrive,
  Trash2,
  Eye,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { FileSearchDocument } from "@/types";

/**
 * Documents Page
 *
 * 문서 업로드 및 관리
 */
export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const storeName = decodeURIComponent(params.storeName as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentStore, setCurrentStore } = useStoresState();
  const { documents, setDocuments, removeDocument } = useDocumentsState();
  const { setLoading, setError, clearError } = useUIState();

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<FileSearchDocument | null>(
    null
  );

  useEffect(() => {
    loadStore();
  }, [storeName]);

  useEffect(() => {
    if (currentStore) {
      loadDocuments();
    }
  }, [currentStore]);

  async function loadStore() {
    if (currentStore?.displayName === storeName) {
      return;
    }

    setLoading(true, "스토어 로딩 중...");
    clearError();

    try {
      const response = await fetch(`/api/stores/${storeName}`);
      const data = await response.json();

      if (data.success) {
        setCurrentStore(data.data);
      } else {
        setError(data.error || "스토어를 찾을 수 없습니다");
        setTimeout(() => router.push("/stores"), 2000);
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    setLoading(true, "문서 목록 로딩 중...");
    clearError();

    try {
      const response = await fetch(`/api/stores/${storeName}/documents`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data.data);
      } else {
        setError(data.error || "문서 목록을 불러오는데 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max files
    if (files.length > 10) {
      setError("최대 10개의 파일만 업로드 가능합니다");
      return;
    }

    // Check file sizes
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversized = files.filter((f) => f.size > maxSize);
    if (oversized.length > 0) {
      setError(
        `파일 크기는 50MB를 초과할 수 없습니다: ${oversized.map((f) => f.name).join(", ")}`
      );
      return;
    }

    setUploadFiles(files);
  }

  async function handleUpload() {
    if (uploadFiles.length === 0) {
      setError("업로드할 파일을 선택해주세요");
      return;
    }

    setLoading(true, `${uploadFiles.length}개 파일 업로드 중...`);
    clearError();

    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/stores/${storeName}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        await loadDocuments(); // Refresh list
      } else {
        setError(data.error || "파일 업로드에 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (!currentStore) {
    return null;
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/stores")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentStore.displayName}</h1>
            <p className="text-sm text-muted-foreground">문서 관리</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/workspace/${storeName}`)}>
          쿼리 워크스페이스로 이동
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>파일 업로드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.txt,.pdf,.csv,.json,.html,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                클릭하여 파일 선택
                <br />
                <span className="text-xs">
                  최대 10개, 파일당 50MB 이하
                </span>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  선택된 파일 ({uploadFiles.length}개)
                </p>
                <div className="space-y-1">
                  {uploadFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
                <Button onClick={handleUpload} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  업로드
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>문서 목록 ({documents.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <File className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">문서가 없습니다</h3>
                <p className="text-sm text-muted-foreground">
                  파일을 업로드하여 시작하세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/documents/${storeName}/${encodeURIComponent(doc.displayName)}`
                        )
                      }
                    >
                      <File className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.displayName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.createTime)}
                          </span>
                          {doc.sizeBytes && (
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(doc.sizeBytes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() =>
                          router.push(
                            `/documents/${storeName}/${encodeURIComponent(doc.displayName)}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(doc);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
