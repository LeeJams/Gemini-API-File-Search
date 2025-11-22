"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Key, ExternalLink } from "lucide-react";
import { useAppStore } from "@/store";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * API Key Input Modal
 *
 * Gemini API 키를 입력받는 모달
 */
export function ApiKeyModal({ open, onOpenChange }: ApiKeyModalProps) {
  const { apiKey, setApiKey } = useAppStore();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (apiKey) {
      setInputValue(apiKey);
    }
  }, [apiKey]);

  const handleSave = () => {
    const trimmedKey = inputValue.trim();

    if (!trimmedKey) {
      setError("API 키를 입력해주세요");
      return;
    }

    // Basic validation: Gemini API keys typically start with "AIza"
    if (!trimmedKey.startsWith("AIza")) {
      setError("올바른 Gemini API 키 형식이 아닙니다");
      return;
    }

    setApiKey(trimmedKey);
    setError("");
    onOpenChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md"
        onPointerDownOutside={(e) => {
          // API 키가 없으면 모달을 닫을 수 없도록 설정
          if (!apiKey) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // API 키가 없으면 ESC로도 닫을 수 없도록 설정
          if (!apiKey) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gemini API 키 입력
          </DialogTitle>
          <DialogDescription className="text-sm space-y-2">
            <p>
              Gemini File Search를 사용하려면 API 키가 필요합니다.
              <br />
              API 키는 브라우저에 안전하게 저장됩니다.
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              API 키 발급받기
              <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 키</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIza..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              API 키는 &quot;AIza&quot;로 시작합니다
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} className="w-full" size="lg">
              저장
            </Button>
            {apiKey && (
              <Button
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                className="w-full"
              >
                취소
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
