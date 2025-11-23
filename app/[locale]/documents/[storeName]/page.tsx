"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  useStoresState,
  useDocumentsState,
  useUIState,
  useAppStore,
} from "@/store";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Upload,
  File,
  Calendar,
  HardDrive,
  Trash2,
  Eye,
  Plus,
  X,
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
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const storeName = decodeURIComponent(params.storeName as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentStore, setCurrentStore } = useStoresState();
  const { documents, setDocuments, removeDocument } = useDocumentsState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey } = useAppStore();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<FileSearchDocument | null>(
    null
  );
  const [selectedDocument, setSelectedDocument] =
    useState<FileSearchDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customMetadata, setCustomMetadata] = useState<
    Array<{ key: string; value: string; type: "string" | "number" | "stringList" }>
  >([]);

  useEffect(() => {
    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    loadStore();
  }, [storeName, apiKey, router]);

  useEffect(() => {
    if (currentStore && hasApiKey()) {
      loadDocuments();
    }
  }, [currentStore]);

  async function loadStore() {
    if (currentStore?.displayName === storeName) {
      return;
    }

    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    setLoading(true, t("loadingStore"));
    clearError();

    try {
      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch(`/api/stores/${storeName}`, { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
        setTimeout(() => router.push("/stores"), 2000);
        return;
      }

      setCurrentStore(data.data);
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    if (!hasApiKey()) {
      return;
    }

    setLoading(true, t("loadingDocuments"));
    clearError();

    try {
      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch(`/api/stores/${storeName}/documents`, {
        headers,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      setDocuments(data.data.data);
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
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
        t("errorMaxFiles", { count: uploadFiles.length })
      );
      return;
    }

    // Check file sizes
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversized = files.filter((f) => f.size > maxSize);
    if (oversized.length > 0) {
      setError(
        t("errorFileSize", { files: oversized.map((f) => f.name).join(", ") })
      );
      return;
    }

    // 중복 파일 체크 (같은 이름의 파일)
    const existingNames = uploadFiles.map((f) => f.name);
    const duplicates = files.filter((f) => existingNames.includes(f.name));
    if (duplicates.length > 0) {
      setError(
        t("errorDuplicate", { files: duplicates.map((f) => f.name).join(", ") })
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
    setCustomMetadata([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAddMetadata() {
    if (customMetadata.length >= 20) {
      setError(t("errorMetadataMax"));
      return;
    }
    setCustomMetadata([...customMetadata, { key: "", value: "", type: "string" }]);
  }

  function handleRemoveMetadata(index: number) {
    setCustomMetadata(customMetadata.filter((_, idx) => idx !== index));
  }

  function handleMetadataChange(
    index: number,
    field: "key" | "value" | "type",
    value: string
  ) {
    const updated = [...customMetadata];
    if (field === "type") {
      updated[index][field] = value as "string" | "number" | "stringList";
    } else {
      updated[index][field] = value;
    }
    setCustomMetadata(updated);
  }

  async function handleUpload() {
    if (uploadFiles.length === 0) {
      setError(t("errorSelectFile"));
      return;
    }

    // Validate metadata
    for (const meta of customMetadata) {
      if (!meta.key.trim()) {
        setError(t("errorMetadataKeyEmpty"));
        return;
      }
      if (!meta.value.trim()) {
        setError(t("errorMetadataValueEmpty"));
        return;
      }
    }

    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    setLoading(true, t("uploading", { count: uploadFiles.length }));
    clearError();

    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Add metadata if any
      if (customMetadata.length > 0) {
        formData.append("customMetadata", JSON.stringify(customMetadata));
      }

      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch(`/api/stores/${storeName}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await response.json();

      // 성공한 파일이 있으면 목록 새로고침
      if (data.data?.successCount > 0) {
        await loadDocuments();
      }

      if (data.success) {
        // 모든 파일 업로드 성공
        setUploadFiles([]);
        setCustomMetadata([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        // 일부 또는 모든 파일 업로드 실패
        setError(data.error || "파일 업로드에 실패했습니다");

        // 성공한 파일이 있으면 실패한 파일만 남기기
        if (data.data?.successCount > 0 && data.data?.results) {
          const failedFileNames = data.data.results
            .filter((r: any) => !r.success)
            .map((r: any) => r.fileName);

          const remainingFiles = uploadFiles.filter((f) =>
            failedFileNames.includes(f.name)
          );

          setUploadFiles(remainingFiles);
        }
      }
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDocument(doc: FileSearchDocument) {
    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    setLoading(true, t("deleting"));
    clearError();

    try {
      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch(
        `/api/stores/${storeName}/documents/${encodeURIComponent(doc.displayName)}`,
        {
          method: "DELETE",
          headers,
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      removeDocument(doc.displayName);
      setDeleteConfirm(null);
      await loadDocuments(); // Refresh list
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
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
    <div className="container py-6 md:py-8">
      {/* API Key Modal */}
      <ApiKeyModal
        open={isApiKeyModalOpen}
        onOpenChange={(open) => {
          setIsApiKeyModalOpen(open);
          // Reload data after API key is set
          if (!open && hasApiKey()) {
            loadStore();
          }
        }}
      />

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
            <p className="text-sm text-muted-foreground">{t("title")}</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/workspace/${storeName}`)}
          className="w-full md:w-auto flex-shrink-0"
        >
          {t("goToWorkspace")}
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(300px,400px)_1fr]">
        {/* Upload Section */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">{t("fileUpload")}</CardTitle>
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
                {t("clickToAdd")}
                <br />
                <span className="text-xs">
                  {t("uploadHint")}
                </span>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {t("selectedFilesCount", { count: uploadFiles.length })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFiles}
                    className="h-auto py-1 text-xs text-destructive hover:text-destructive"
                  >
                    {t("deleteAll")}
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

                {/* Custom Metadata Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-base font-semibold">
                        {t("customMetadata")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("customMetadataHint")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddMetadata}
                      disabled={customMetadata.length >= 20}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addMetadata")}
                    </Button>
                  </div>

                  {customMetadata.length > 0 && (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {customMetadata.map((meta, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-4 rounded-lg border bg-card"
                        >
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">
                                {t("metadataKey")}
                              </Label>
                              <Input
                                placeholder={t("metadataKeyPlaceholder")}
                                value={meta.key}
                                onChange={(e) =>
                                  handleMetadataChange(idx, "key", e.target.value)
                                }
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">
                                {t("metadataValue")}
                              </Label>
                              {meta.type === "stringList" ? (
                                <Input
                                  placeholder={t("metadataValueListPlaceholder")}
                                  value={meta.value}
                                  onChange={(e) =>
                                    handleMetadataChange(idx, "value", e.target.value)
                                  }
                                  className="h-10"
                                />
                              ) : (
                                <Input
                                  type={meta.type === "number" ? "number" : "text"}
                                  placeholder={t("metadataValuePlaceholder")}
                                  value={meta.value}
                                  onChange={(e) =>
                                    handleMetadataChange(idx, "value", e.target.value)
                                  }
                                  className="h-10"
                                />
                              )}
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">
                                {t("metadataType")}
                              </Label>
                              <select
                                value={meta.type}
                                onChange={(e) =>
                                  handleMetadataChange(idx, "type", e.target.value)
                                }
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <option value="string">{t("metadataTypeString")}</option>
                                <option value="number">{t("metadataTypeNumber")}</option>
                                <option value="stringList">
                                  {t("metadataTypeStringList")}
                                </option>
                              </select>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMetadata(idx)}
                            className="h-10 w-10 shrink-0 mt-6"
                          >
                            <X className="h-5 w-5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleUpload} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  {t("uploadButton", { count: uploadFiles.length })}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              {t("documentList", { count: documents.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <File className="mb-3 md:mb-4 h-10 md:h-12 w-10 md:w-12 text-muted-foreground" />
                <h3 className="mb-2 text-base md:text-lg font-semibold">
                  {t("emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("emptyDescription")}
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("deleteConfirmMessage", { name: deleteConfirm?.displayName })}
              <br />
              <span className="font-semibold text-destructive">
                {t("deleteConfirmWarning")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="w-full sm:w-auto"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirm && handleDeleteDocument(deleteConfirm)
              }
              className="w-full sm:w-auto"
            >
              {tCommon("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
