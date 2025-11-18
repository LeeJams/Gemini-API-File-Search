"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStoresState, useQueryState, useUIState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Send,
  History,
  FileText,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { QueryHistoryItem } from "@/types";

/**
 * Workspace Page
 *
 * RAG 쿼리 실행 및 결과 표시
 */
export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const storeName = decodeURIComponent(params.storeName as string);

  const { currentStore, setCurrentStore } = useStoresState();
  const { history, addToHistory, currentResult, setCurrentResult } =
    useQueryState();
  const { setLoading, setError, clearError } = useUIState();

  const [query, setQuery] = useState("");
  const [metadataFilter, setMetadataFilter] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadStore();
  }, [storeName]);

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

  async function handleExecuteQuery() {
    if (!query.trim()) {
      setError("쿼리를 입력해주세요");
      return;
    }

    setLoading(true, "쿼리 실행 중...");
    clearError();

    try {
      const response = await fetch(`/api/stores/${storeName}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          metadataFilter: metadataFilter.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = {
          text: data.data.text,
          groundingMetadata: data.data.groundingMetadata,
          timestamp: Date.now(),
        };

        setCurrentResult(result);

        // Add to history
        const historyItem: QueryHistoryItem = {
          id: Date.now().toString(),
          query: query.trim(),
          response: data.data.text,
          timestamp: Date.now(),
          storeName,
        };
        addToHistory(historyItem);

        // Clear query input
        setQuery("");
      } else {
        setError(data.error || "쿼리 실행에 실패했습니다");
      }
    } catch (error: any) {
      setError(error.message || "네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function loadHistoryItem(item: QueryHistoryItem) {
    setQuery(item.query);
    setCurrentResult({
      text: item.response,
      groundingMetadata: null,
      timestamp: item.timestamp,
    });
    setShowHistory(false);
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
            <p className="text-sm text-muted-foreground">쿼리 워크스페이스</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          히스토리 {showHistory ? "숨기기" : "보기"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Query Input */}
          <Card>
            <CardHeader>
              <CardTitle>쿼리 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">질문을 입력하세요</Label>
                <div className="flex gap-2">
                  <Input
                    id="query"
                    placeholder="문서에 대해 질문하세요..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleExecuteQuery();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleExecuteQuery} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter">메타데이터 필터 (선택사항)</Label>
                <Input
                  id="filter"
                  placeholder='예: doc_type="manual"'
                  value={metadataFilter}
                  onChange={(e) => setMetadataFilter(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {currentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI 응답
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{currentResult.text}</ReactMarkdown>
                </div>

                {currentResult.groundingMetadata && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 text-sm font-semibold">
                      참조 문서 정보
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Grounding metadata가 포함되어 있습니다
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-muted-foreground">
                  {formatDate(new Date(currentResult.timestamp))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!currentResult && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  쿼리를 실행해보세요
                </h3>
                <p className="text-sm text-muted-foreground">
                  업로드된 문서에 대해 질문하세요
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">쿼리 히스토리</CardTitle>
            </CardHeader>
            <CardContent>
              {history.filter((h) => h.storeName === storeName).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  히스토리가 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {history
                    .filter((h) => h.storeName === storeName)
                    .slice(0, 10)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="flex w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                      >
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.query}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(item.timestamp))}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
