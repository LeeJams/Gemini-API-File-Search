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
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
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
  const [selectedDocument, setSelectedDocument] =
    useState<FileSearchDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

    // Check max files (기존 파일 + 새 파일)
    if (uploadFiles.length + files.length > 10) {
      setError(
        `최대 10개의 파일만 업로드 가능합니다 (현재 ${uploadFiles.length}개 선택됨)`
      );
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

    // 중복 파일 체크 (같은 이름의 파일)
    const existingNames = uploadFiles.map((f) => f.name);
    const duplicates = files.filter((f) => existingNames.includes(f.name));
    if (duplicates.length > 0) {
      setError(
        `이미 선택된 파일입니다: ${duplicates.map((f) => f.name).join(", ")}`
      );
      return;
    }

    // 기존 파일에 추가
    setUploadFiles([...uploadFiles, ...files]);

    // Reset input so same file can be selected again after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveFile(index: number) {
    setUploadFiles(uploadFiles.filter((_, idx) => idx !== index));
  }

  function handleClearAllFiles() {
    setUploadFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  function handleDocumentClick(doc: FileSearchDocument) {
    setSelectedDocument(doc);
    setDetailModalOpen(true);
  }

  if (!currentStore) {
    return null;
  }

  return (
    <div className="container px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/stores")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold truncate">
              {currentStore.displayName}
            </h1>
            <p className="text-sm text-muted-foreground">문서 관리</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/workspace/${storeName}`)}
          className="w-full md:w-auto flex-shrink-0"
        >
          쿼리 워크스페이스로 이동
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(300px,400px)_1fr]">
        {/* Upload Section */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">파일 업로드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-4 md:p-6 text-center">
              <Upload className="mx-auto mb-3 md:mb-4 h-10 md:h-12 w-10 md:w-12 text-muted-foreground" />
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
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground block"
              >
                클릭하여 파일 추가
                <br />
                <span className="text-xs">
                  여러 번 선택 가능 · 최대 10개 · 파일당 50MB 이하
                </span>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    선택된 파일 ({uploadFiles.length}개)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFiles}
                    className="h-auto py-1 text-xs text-destructive hover:text-destructive"
                  >
                    전체 삭제
                  </Button>
                </div>
                <div className="max-h-[200px] space-y-1 overflow-y-auto">
                  {uploadFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent"
                    >
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate text-xs md:text-sm">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleUpload} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadFiles.length}개 파일 업로드
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              문서 목록 ({documents.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <File className="mb-3 md:mb-4 h-10 md:h-12 w-10 md:w-12 text-muted-foreground" />
                <h3 className="mb-2 text-base md:text-lg font-semibold">
                  문서가 없습니다
                </h3>
                <p className="text-sm text-muted-foreground">
                  파일을 업로드하여 시작하세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="group flex items-center justify-between rounded-lg border p-3 md:p-4 transition-colors hover:bg-accent"
                  >
                    <div
                      className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <File className="h-4 md:h-5 w-4 md:w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate">
                          {doc.displayName}
                        </p>
                        <div className="flex items-center gap-2 md:gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {formatDate(doc.createTime)}
                            </span>
                            <span className="sm:hidden">
                              {formatDate(doc.createTime).split(" ")[0]}
                            </span>
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
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={() => handleDocumentClick(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
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

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDocument}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
