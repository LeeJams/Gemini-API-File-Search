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
import {
  ArrowLeft,
  Send,
  FileText,
  ChevronRight,
  ChevronDown,
  Settings,
  Database,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { QueryHistoryItem, GenerationConfig } from "@/types";

/**
 * Workspace Page
 *
 * RAG 쿼리 실행 및 결과 표시
 */
export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = decodeURIComponent(params.storeId as string);
  const t = useTranslations("workspace");
  const tCommon = useTranslations("common");

  const { currentStore, setCurrentStore } = useStoresState();
  const { history, addToHistory, currentResult, setCurrentResult } =
    useQueryState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey, _hasHydrated } = useAppStore();
  const { selectedModel, setSelectedModel } = useModelState();

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [metadataFilter, setMetadataFilter] = useState("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Advanced options state
  const [systemInstruction, setSystemInstruction] = useState("");
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number | undefined>(
    undefined
  );
  const [topP, setTopP] = useState<number | undefined>(undefined);
  const [topK, setTopK] = useState<number | undefined>(undefined);

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

      // Build generationConfig if any advanced options are set
      const generationConfig: GenerationConfig = {};
      if (temperature !== undefined) generationConfig.temperature = temperature;
      if (maxOutputTokens !== undefined)
        generationConfig.maxOutputTokens = maxOutputTokens;
      if (topP !== undefined) generationConfig.topP = topP;
      if (topK !== undefined) generationConfig.topK = topK;

      const requestBody: any = {
        query: query.trim(),
        metadataFilter: metadataFilter.trim() || null,
        model: selectedModel,
      };

      // Add optional fields only if they have values
      if (systemInstruction.trim()) {
        requestBody.systemInstruction = systemInstruction.trim();
      }
      if (Object.keys(generationConfig).length > 0) {
        requestBody.generationConfig = generationConfig;
      }

      const response = await fetch(`/api/stores/${storeId}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
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
        storeName: storeId,
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
    <div className="container py-6 md:py-8 max-w-7xl">
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
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3 md:gap-4">
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

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Query Input */}
          <Card className="border-border/40 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                {t("queryInput")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium text-muted-foreground">
                    {t("modelLabel")}
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-sm bg-background/50 backdrop-blur-sm"
                      >
                        <span className="truncate">{selectedModel}</span>
                        <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[240px]"
                    >
                      {SUPPORTED_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model}
                          onClick={() => setSelectedModel(model)}
                          className={selectedModel === model ? "bg-accent font-medium" : ""}
                        >
                          {model}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter" className="text-sm font-medium text-muted-foreground">
                    {t("metadataFilter")}
                  </Label>
                  <Input
                    id="filter"
                    placeholder={t("metadataFilterPlaceholder")}
                    value={metadataFilter}
                    onChange={(e) => setMetadataFilter(e.target.value)}
                    className="text-sm bg-background/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query" className="text-sm font-medium text-muted-foreground">
                  {t("questionLabel")}
                </Label>
                <div className="relative">
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
                    className="pr-12 py-6 text-base shadow-sm bg-background/50 backdrop-blur-sm focus-visible:ring-primary/30"
                  />
                  <Button
                    onClick={handleExecuteQuery}
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full shadow-sm"
                    disabled={!query.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent/50"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t("advancedOptions")}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showAdvancedOptions ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showAdvancedOptions && (
                  <div className="mt-4 space-y-4 animate-accordion-down">
                    {/* System Instruction */}
                    <div className="space-y-2">
                      <Label htmlFor="systemInstruction" className="text-sm">
                        {t("systemInstruction")}
                      </Label>
                      <Input
                        id="systemInstruction"
                        placeholder={t("systemInstructionPlaceholder")}
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("systemInstructionHint")}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Temperature */}
                      <div className="space-y-2">
                        <Label htmlFor="temperature" className="text-sm">
                          {t("temperature")}
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="temperature"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            placeholder="0.0 - 2.0"
                            value={temperature ?? ""}
                            onChange={(e) =>
                              setTemperature(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Max Output Tokens */}
                      <div className="space-y-2">
                        <Label htmlFor="maxOutputTokens" className="text-sm">
                          {t("maxOutputTokens")}
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="maxOutputTokens"
                            type="number"
                            min="1"
                            placeholder="Max tokens"
                            value={maxOutputTokens ?? ""}
                            onChange={(e) =>
                              setMaxOutputTokens(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Top P */}
                      <div className="space-y-2">
                        <Label htmlFor="topP" className="text-sm">
                          {t("topP")}
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="topP"
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            placeholder="0.0 - 1.0"
                            value={topP ?? ""}
                            onChange={(e) =>
                              setTopP(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {currentResult && (
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  {t("aiResponse")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none leading-relaxed">
                  <ReactMarkdown>{currentResult.text}</ReactMarkdown>
                </div>

                {currentResult.groundingMetadata && (
                  <div className="mt-8 rounded-lg border bg-muted/30 p-4">
                    <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      {t("groundingMetadataTitle")}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("groundingMetadataDescription")}
                    </p>
                  </div>
                )}

                <div className="mt-6 text-xs text-muted-foreground text-right font-medium">
                  {formatDate(new Date(currentResult.timestamp))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!currentResult && (
            <Card className="border-dashed border-2 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Send className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground/80">
                  {t("emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {t("emptyDescription")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="font-semibold text-lg tracking-tight">{t("queryHistory")}</h3>
             <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
               {history.filter((h) => h.storeName === storeId).length}
             </span>
          </div>
          
          <Card className="h-fit max-h-[calc(100vh-12rem)] overflow-y-auto border-border/40 shadow-sm">
            <CardContent className="p-2">
              {history.filter((h) => h.storeName === storeId).length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("historyEmpty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {history
                    .filter((h) => h.storeName === storeId)
                    .slice(0, 10)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="group flex w-full flex-col gap-1 rounded-md border border-transparent p-3 text-left transition-all hover:bg-accent hover:border-border/50 active:bg-accent/80"
                      >
                        <p className="truncate text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors">
                          {item.query}
                        </p>
                        <div className="flex items-center justify-between w-full">
                          <p className="text-[10px] text-muted-foreground/70">
                            {formatDate(new Date(item.timestamp))}
                          </p>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
