"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  useStoresState,
  useQueryState,
  useUIState,
  useAppStore,
  useModelState,
} from "@/store";
import { SUPPORTED_MODELS } from "@/store/slices/modelSlice";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Send, FileText, ChevronRight, ChevronDown } from "lucide-react";
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
  const t = useTranslations("workspace");
  const tCommon = useTranslations("common");

  const { currentStore, setCurrentStore } = useStoresState();
  const { history, addToHistory, currentResult, setCurrentResult } =
    useQueryState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey } = useAppStore();
  const { selectedModel, setSelectedModel } = useModelState();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [metadataFilter, setMetadataFilter] = useState("");

  useEffect(() => {
    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    loadStore();
  }, [storeName, apiKey, router]);

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

  async function handleExecuteQuery() {
    if (!query.trim()) {
      setError(t("errorEmptyQuery"));
      return;
    }

    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    setLoading(true, t("executingQuery"));
    clearError();

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "x-api-key": apiKey || "",
      };

      const response = await fetch(`/api/stores/${storeName}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: query.trim(),
          metadataFilter: metadataFilter.trim() || null,
          model: selectedModel,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

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
    } catch (error: any) {
      setError(error.message || tCommon("networkError"));
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
          // Reload store after API key is set
          if (!open && hasApiKey()) {
            loadStore();
          }
        }}
      />

      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3 md:gap-4">
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
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_minmax(250px,300px)]">
        {/* Main Content */}
        <div className="space-y-4 md:space-y-6">
          {/* Query Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">{t("queryInput")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm">
                  {t("modelLabel")}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-sm md:text-base"
                    >
                      <span className="truncate">{selectedModel}</span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[300px] md:min-w-[400px]">
                    {SUPPORTED_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model}
                        onClick={() => setSelectedModel(model)}
                        className={selectedModel === model ? "bg-accent" : ""}
                      >
                        {model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query" className="text-sm">
                  {t("questionLabel")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="query"
                    placeholder={t("questionPlaceholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleExecuteQuery();
                      }
                    }}
                    className="flex-1 text-sm md:text-base"
                  />
                  <Button
                    onClick={handleExecuteQuery}
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter" className="text-sm">
                  {t("metadataFilter")}
                </Label>
                <Input
                  id="filter"
                  placeholder={t("metadataFilterPlaceholder")}
                  value={metadataFilter}
                  onChange={(e) => setMetadataFilter(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {currentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="h-5 w-5" />
                  {t("aiResponse")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm md:prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{currentResult.text}</ReactMarkdown>
                </div>

                {currentResult.groundingMetadata && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 text-sm font-semibold">
                      {t("groundingMetadataTitle")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t("groundingMetadataDescription")}
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
              <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                <Send className="mb-3 md:mb-4 h-10 md:h-12 w-10 md:w-12 text-muted-foreground" />
                <h3 className="mb-2 text-base md:text-lg font-semibold">
                  {t("emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t("emptyDescription")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Sidebar */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              {t("queryHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.filter((h) => h.storeName === storeName).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("historyEmpty")}
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
                      className="flex w-full items-start gap-2 rounded-lg border p-2 md:p-3 text-left transition-colors hover:bg-accent active:bg-accent"
                    >
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs md:text-sm font-medium">
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
      </div>
    </div>
  );
}
