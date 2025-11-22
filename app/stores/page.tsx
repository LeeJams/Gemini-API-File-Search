"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStoresState, useUIState } from "@/store";
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
  const router = useRouter();
  const { stores, setStores, setCurrentStore, isCacheValid, removeStore } =
    useStoresState();
  const { setLoading, setError, clearError } = useUIState();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<FileSearchStore | null>(
    null
  );

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores(force = false) {
    // Check cache first (skip if force refresh)
    if (!force && stores.length > 0 && isCacheValid()) {
      return;
    }

    setLoading(true, "스토어 목록 로딩 중...");
    clearError();

    try {
      const response = await fetch("/api/stores");
      const data = await response.json();

      if (data.success) {
        setStores(data.data.data);
      } else {
        setError(data.error || "스토어 목록을 불러오는데 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateStore() {
    if (!newStoreName.trim()) {
      setError("스토어 이름을 입력해주세요");
      return;
    }

    // Prevent duplicate calls
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setLoading(true, "스토어 생성 중...");
    clearError();

    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newStoreName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        await loadStores(true); // Force refresh list
        setIsCreateModalOpen(false);
        setNewStoreName("");
      } else {
        setError(data.error || "스토어 생성에 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
      setIsCreating(false);
    }
  }

  async function handleDeleteStore(store: FileSearchStore) {
    setLoading(true, "스토어 삭제 중...");
    clearError();

    try {
      const response = await fetch(`/api/stores/${store.displayName}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        removeStore(store.displayName);
        setDeleteConfirm(null);
      } else {
        setError(data.error || "스토어 삭제에 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function navigateToWorkspace(store: FileSearchStore) {
    setCurrentStore(store);
    router.push(`/workspace/${encodeURIComponent(store.displayName)}`);
  }

  function navigateToDocuments(store: FileSearchStore) {
    setCurrentStore(store);
    router.push(`/documents/${encodeURIComponent(store.displayName)}`);
  }

  return (
    <div className="container py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 space-y-4 md:flex md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Stores
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            File Search Store를 선택하거나 새로운 스토어를 추가하세요
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />새 스토어 추가
        </Button>
      </div>

      {/* Empty State */}
      {stores.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">스토어가 없습니다</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              새 스토어를 추가하여 시작하세요
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              스토어 추가
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
                  <span className="truncate">쿼리 워크스페이스</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateToDocuments(store)}
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span className="truncate">문서 관리</span>
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
            <DialogTitle>새 스토어 추가</DialogTitle>
            <DialogDescription className="text-sm">
              새로운 File Search Store를 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">스토어 이름</Label>
              <Input
                id="storeName"
                placeholder="my-store"
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
                영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능
              </p>
            </div>
            <Button
              onClick={handleCreateStore}
              className="w-full"
              size="lg"
              disabled={isCreating}
            >
              생성
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
            <DialogTitle>스토어 삭제 확인</DialogTitle>
            <DialogDescription className="text-sm">
              정말로 &quot;{deleteConfirm?.displayName}&quot; 스토어를
              삭제하시겠습니까?
              <br />
              <span className="font-semibold text-destructive">
                이 작업은 되돌릴 수 없으며, 모든 문서가 삭제됩니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="w-full sm:w-auto"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteStore(deleteConfirm)}
              className="w-full sm:w-auto"
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
