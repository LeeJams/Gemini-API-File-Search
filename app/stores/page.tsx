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

  async function loadStores() {
    // Check cache first
    if (stores.length > 0 && isCacheValid()) {
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

  async function handleCreateStore() {
    if (!newStoreName.trim()) {
      setError("스토어 이름을 입력해주세요");
      return;
    }

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
        await loadStores(); // Refresh list
        setIsCreateModalOpen(false);
        setNewStoreName("");
      } else {
        setError(data.error || "스토어 생성에 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
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
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Stores</h1>
          <p className="mt-2 text-muted-foreground">
            File Search Store를 선택하거나 새로운 스토어를 추가하세요
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 스토어 추가
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card
              key={store.name}
              className="group relative overflow-hidden transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      {store.displayName}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
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
                  쿼리 워크스페이스
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateToDocuments(store)}
                >
                  <Database className="mr-2 h-4 w-4" />
                  문서 관리
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Store Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 스토어 추가</DialogTitle>
            <DialogDescription>
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
                    handleCreateStore();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능
              </p>
            </div>
            <Button onClick={handleCreateStore} className="w-full" size="lg">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스토어 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 &quot;{deleteConfirm?.displayName}&quot; 스토어를
              삭제하시겠습니까?
              <br />
              <span className="font-semibold text-destructive">
                이 작업은 되돌릴 수 없으며, 모든 문서가 삭제됩니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteStore(deleteConfirm)}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
