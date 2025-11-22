"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
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
  const pathname = usePathname();
  const { hasApiKey, clearApiKey } = useAppStore();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const navItems = [
    {
      href: "/stores",
      label: "Stores",
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/stores" className="flex items-center">
            <span className="font-bold text-xl">Gemini File Search</span>
          </Link>

          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-foreground"
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
            className="gap-2"
          >
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isHydrated && hasApiKey() ? "API 키 초기화" : "API 키 입력"}
            </span>
          </Button>
          <ThemeToggle />
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
            <DialogTitle>API 키 초기화 확인</DialogTitle>
            <DialogDescription className="text-sm">
              저장된 API 키를 삭제하시겠습니까?
              <br />
              삭제 후에는 다시 입력해야 합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="w-full sm:w-auto"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearApiKey}
              className="w-full sm:w-auto gap-2"
            >
              <Trash2 className="h-4 w-4" />
              초기화
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
