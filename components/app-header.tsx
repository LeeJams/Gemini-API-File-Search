"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import { Database, Key, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * App Header Component
 *
 * 전역 헤더 - 네비게이션 및 테마 토글
 */
export function AppHeader() {
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { hasApiKey, clearApiKey } = useAppStore();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const navItems = [
    {
      href: "/stores" as const,
      label: tCommon("stores"),
      icon: Database,
    },
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleClearApiKey = () => {
    clearApiKey();
    setIsConfirmDeleteOpen(false);
  };

  const handleApiKeyButtonClick = () => {
    if (hasApiKey()) {
      setIsConfirmDeleteOpen(true);
    } else {
      setIsApiKeyModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/stores" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                  pathname.endsWith(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleApiKeyButtonClick}
            className="gap-2 rounded-full border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isHydrated && hasApiKey() ? t("apiKeyReset") : t("apiKeyInput")}
            </span>
          </Button>
          <div className="flex items-center gap-1 border-l border-border/50 pl-2 ml-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        open={isApiKeyModalOpen}
        onOpenChange={setIsApiKeyModalOpen}
      />

      {/* Confirm Delete API Key Modal */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{t("resetConfirmTitle")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("resetConfirmMessage")}
              <br />
              {t("resetConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="w-full sm:w-auto"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearApiKey}
              className="w-full sm:w-auto gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t("reset")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
