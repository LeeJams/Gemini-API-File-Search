"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useStoresState, useUIState, useAppStore } from "@/store";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Database, FileText, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { FileSearchStore } from "@/types";

/**
 * Stores Page
 *
 * File Search Store 목록 및 관리
 */
export default function StoresPage() {
  const t = useTranslations("stores");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { stores, setStores, setCurrentStore, isCacheValid, removeStore } =
    useStoresState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey } = useAppStore();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<FileSearchStore | null>(
    null
  );

  useEffect(() => {
    // Check if API key exists
    if (!hasApiKey()) {
      setIsApiKeyModalOpen(true);
    } else {
      loadStores();
    }
  }, [apiKey]);

  async function loadStores(force = false) {
    // Check cache first (skip if force refresh)
    if (!force && stores.length > 0 && isCacheValid()) {
      return;
    }

    if (!hasApiKey()) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setLoading(true, t("loadingList"));
    clearError();

    try {
      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch("/api/stores", { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      setStores(data.data.data);
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateStore() {
    if (!newStoreName.trim()) {
      setError(t("errorEmptyName"));
      return;
    }

    if (!hasApiKey()) {
      setIsApiKeyModalOpen(true);
      return;
    }

    // Prevent duplicate calls
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setLoading(true, t("creating"));
    clearError();

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-api-key": apiKey || "",
      };

      const response = await fetch("/api/stores", {
        method: "POST",
        headers,
        body: JSON.stringify({ displayName: newStoreName.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      await loadStores(true); // Force refresh list
      setIsCreateModalOpen(false);
      setNewStoreName("");
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
    } finally {
      setLoading(false);
      setIsCreating(false);
    }
  }

  async function handleDeleteStore(store: FileSearchStore) {
    if (!hasApiKey()) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setLoading(true, t("deleting"));
    clearError();

    try {
      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch(`/api/stores/${store.displayName}`, {
        method: "DELETE",
        headers,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      removeStore(store.displayName);
      setDeleteConfirm(null);
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  }

  function navigateToWorkspace(store: FileSearchStore) {
    setCurrentStore(store);
    router.push({
      pathname: "/workspace/[storeName]",
      params: { storeName: store.displayName },
    });
  }

  function navigateToDocuments(store: FileSearchStore) {
    setCurrentStore(store);
    router.push({
      pathname: "/documents/[storeName]",
      params: { storeName: store.displayName },
    });
  }

  return (
    <div className="container py-6 md:py-8">
      {/* API Key Modal */}
      <ApiKeyModal
        open={isApiKeyModalOpen}
        onOpenChange={(open) => {
          setIsApiKeyModalOpen(open);
          // Reload stores after API key is set
          if (!open && hasApiKey()) {
            loadStores(true);
          }
        }}
      />

      {/* Header */}
      <div className="mb-6 md:mb-8 space-y-4 md:flex md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addNewStore")}
        </Button>
      </div>

      {/* Empty State */}
      {stores.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t("emptyTitle")}</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addStore")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Store Grid */}
      {stores.length > 0 && (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card
              key={store.name}
              className="group relative overflow-hidden transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Database className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-lg md:text-xl truncate">
                      {store.displayName}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(store);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDate(store.createTime)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => navigateToWorkspace(store)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="truncate">{t("queryWorkspace")}</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateToDocuments(store)}
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span className="truncate">{t("documentManagement")}</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Store Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{t("createModalTitle")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("createModalDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">{t("storeName")}</Label>
              <Input
                id="storeName"
                placeholder={t("storeNamePlaceholder")}
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateStore();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("storeNameHint")}
              </p>
            </div>
            <Button
              onClick={handleCreateStore}
              className="w-full"
              size="lg"
              disabled={isCreating}
            >
              {tCommon("create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              onClick={() => deleteConfirm && handleDeleteStore(deleteConfirm)}
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
