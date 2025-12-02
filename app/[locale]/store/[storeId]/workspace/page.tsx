"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import {
  Send,
  ChevronDown,
  Settings,
  Sparkles,
} from "lucide-react";
import { AdvancedSettingsModal } from "@/components/workspace/AdvancedSettingsModal";
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

  const { currentStore } = useStoresState();
  const { addToHistory, currentResult, setCurrentResult } =
    useQueryState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey } = useAppStore();
  const {
    selectedModel,
    setSelectedModel,
    systemInstruction,
    temperature,
    maxOutputTokens,
    topP,
    topK,
    metadataFilter,
  } = useModelState();

  const [query, setQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  if (!currentStore) {
    return null;
  }

  const hasResult = !!currentResult;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-5xl mx-auto p-4 md:p-6 w-full">
          {/* Header / Model Selector */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-lg font-medium gap-2">
                    {selectedModel}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {SUPPORTED_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onClick={() => setSelectedModel(model)}
                    >
                      {model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          {!hasResult ? (
            <div className="flex flex-col items-center justify-center mt-20 md:mt-32 text-center space-y-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t("welcomeTitle")}
              </h1>
              <p className="text-muted-foreground max-w-md">
                {t("welcomeDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Result Display */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown>{currentResult.text}</ReactMarkdown>
              </div>

              {currentResult.groundingMetadata && (
                <div className="border-t pt-4">
                  <h4 className="mb-2 text-sm font-semibold">
                    {t("groundingMetadataTitle")}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t("groundingMetadataDescription")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative rounded-2xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-200">
            <Input
              id="query-input"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteQuery();
                }
              }}
              placeholder={t("questionPlaceholder")}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none py-6 pl-4 pr-12 text-base md:text-lg bg-transparent"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Placeholder buttons for future features */}
              {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Mic className="h-4 w-4" />
              </Button> */}
              <Button
                onClick={handleExecuteQuery}
                size="icon"
                className={query.trim() ? "" : "opacity-50"}
                disabled={!query.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-center">
             <p className="text-xs text-muted-foreground">
              {t("disclaimer")}
            </p>
          </div>
        </div>
      </div>

      <AdvancedSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
