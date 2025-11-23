"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
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
import { Key, ExternalLink, Eye, EyeOff } from "lucide-react";
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
  const t = useTranslations('apiKeyModal');
  const { apiKey, setApiKey } = useAppStore();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setInputValue(apiKey);
    } else {
      setInputValue("");
    }
    setError("");
  }, [apiKey]);

  const handleSave = () => {
    const trimmedKey = inputValue.trim();

    if (!trimmedKey) {
      setError(t('errorEmpty'));
      return;
    }

    // Basic validation: Gemini API keys typically start with "AIza"
    if (!trimmedKey.startsWith("AIza")) {
      setError(t('errorInvalidFormat'));
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
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('description')}
            <br />
            {t('securityNote')}
          </DialogDescription>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t('getApiKey')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">{t('apiKey')}</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={isApiKeyVisible ? "text" : "password"}
                placeholder={t('placeholder')}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                className={`flex-1 ${error ? "border-destructive" : ""}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsApiKeyVisible((prev) => !prev)}
                aria-label={isApiKeyVisible ? t('hideApiKey') : t('showApiKey')}
              >
                {isApiKeyVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('hint')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} className="w-full" size="lg">
              {t('save')}
            </Button>
            {apiKey && (
              <Button
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                className="w-full"
              >
                {t('cancel')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
