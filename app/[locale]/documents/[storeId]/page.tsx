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
  File as FileIcon,
  Calendar,
  HardDrive,
  Trash2,
  Eye,
  Plus,
  X,
  FileText,
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
  const storeId = decodeURIComponent(params.storeId as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentStore, setCurrentStore } = useStoresState();
  const { documents, setDocuments, removeDocument } = useDocumentsState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey, _hasHydrated } = useAppStore();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<FileSearchDocument | null>(
    null
  );
  const [selectedDocument, setSelectedDocument] =
    useState<FileSearchDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customMetadata, setCustomMetadata] = useState<
    Array<{
      key: string;
      value: string;
      type: "string" | "number" | "stringList";
    }>
  >([]);

  useEffect(() => {
    console.log("[DocumentsPage] storeId param (decoded):", storeId);
  }, [storeId]);

  useEffect(() => {
    // Wait for hydration to complete before checking API key
    if (!_hasHydrated) {
      return;
    }

    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    loadStore();
  }, [_hasHydrated, storeId, apiKey, router]);

  useEffect(() => {
    if (currentStore && hasApiKey()) {
      loadDocuments();
    }
  }, [currentStore]);

  async function loadStore() {
    if (currentStore?.name === storeId) {
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

      const response = await fetch(`/api/stores/${storeId}`, { headers });
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

      const response = await fetch(`/api/stores/${storeId}/documents`, {
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
      setError(t("errorMaxFiles", { count: uploadFiles.length }));
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
    setCustomMetadata([
      ...customMetadata,
      { key: "", value: "", type: "string" },
    ]);
  }

  function handleRemoveMetadata(index: number) {
    setCustomMetadata(customMetadata.filter((_, idx) => idx !== index));
  }

  function handleMetadataChange(
    index: number,
    field: "key" | "value" | "type",
    value: string
  ) {
    setCustomMetadata((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (field === "type") {
          return { ...item, type: value as "string" | "number" | "stringList" };
        }
        return { ...item, [field]: value };
      })
    );
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

      const response = await fetch(`/api/stores/${storeId}/upload`, {
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
        `/api/stores/${storeId}/documents/${encodeURIComponent(doc.displayName)}`,
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
    <div className="container py-6 md:py-8 max-w-7xl">
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
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/stores")}
            className="flex-shrink-0 rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold truncate tracking-tight">
              {currentStore.displayName}
            </h1>
            <p className="text-sm text-muted-foreground">{t("title")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[minmax(320px,400px)_1fr]">
        {/* Upload Section */}
        <Card className="min-w-0 border-border/40 shadow-sm h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {t("fileUpload")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 md:p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/10">
              <Upload className="mx-auto mb-4 h-12 w-12 text-primary/60" />
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
                className="cursor-pointer block"
              >
                <span className="text-base font-medium text-foreground hover:text-primary transition-colors">
                  {t("clickToAdd")}
                </span>
                <br />
                <span className="text-xs text-muted-foreground mt-2 block">{t("uploadHint")}</span>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground/80">
                    {t("selectedFilesCount", { count: uploadFiles.length })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFiles}
                    className="h-auto py-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {t("deleteAll")}
                  </Button>
                </div>
                <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {uploadFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="rounded bg-muted p-1.5">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Custom Metadata Section */}
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold">
                        {t("customMetadata")}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("customMetadataHint")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMetadata}
                      disabled={customMetadata.length >= 20}
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {t("addMetadata")}
                    </Button>
                  </div>

                  {customMetadata.length > 0 && (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {customMetadata.map((meta, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 p-3 rounded-lg border bg-muted/30 relative group"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  {t("metadataKey")}
                                </Label>
                                <Input
                                  placeholder="Key"
                                  value={meta.key}
                                  onChange={(e) =>
                                    handleMetadataChange(
                                      idx,
                                      "key",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 text-xs bg-background"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  {t("metadataType")}
                                </Label>
                                <select
                                  value={meta.type}
                                  onChange={(e) =>
                                    handleMetadataChange(
                                      idx,
                                      "type",
                                      e.target.value
                                    )
                                  }
                                  className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <option value="string">String</option>
                                  <option value="number">Number</option>
                                  <option value="stringList">List</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {t("metadataValue")}
                              </Label>
                              {meta.type === "stringList" ? (
                                <Input
                                  placeholder="Value1, Value2, ..."
                                  value={meta.value}
                                  onChange={(e) =>
                                    handleMetadataChange(
                                      idx,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 text-xs bg-background"
                                />
                              ) : (
                                <Input
                                  type={
                                    meta.type === "number" ? "number" : "text"
                                  }
                                  placeholder="Value"
                                  value={meta.value}
                                  onChange={(e) =>
                                    handleMetadataChange(
                                      idx,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 text-xs bg-background"
                                />
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMetadata(idx)}
                            className="h-6 w-6 shrink-0 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleUpload} className="w-full shadow-sm hover:shadow-md transition-all">
                  <Upload className="mr-2 h-4 w-4" />
                  {t("uploadButton", { count: uploadFiles.length })}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="min-w-0 border-border/40 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("documentList", { count: documents.length })}
              </CardTitle>
              {/* Optional: Add sort/filter controls here */}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <FileIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground/80">
                  {t("emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t("emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="group flex items-center justify-between p-4 transition-all hover:bg-muted/30"
                  >
                    <div
                      className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate text-foreground/90 group-hover:text-primary transition-colors">
                          {doc.displayName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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
                        className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
                        onClick={() => handleDocumentClick(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(doc);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
              {t("deleteConfirmMessage", {
                name: deleteConfirm?.displayName || "",
              })}
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
