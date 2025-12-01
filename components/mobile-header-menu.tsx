"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Key, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useAppStore } from "@/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiKeyModal } from "@/components/ApiKeyModal";

export function MobileHeaderMenu() {
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { hasApiKey, clearApiKey } = useAppStore();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleClearApiKey = () => {
    clearApiKey();
    setIsConfirmDeleteOpen(false);
    setOpen(false);
  };

  const handleApiKeyButtonClick = () => {
    if (hasApiKey()) {
      setIsConfirmDeleteOpen(true);
    } else {
      setIsApiKeyModalOpen(true);
    }
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader className="text-left border-b pb-4">
            <SheetTitle>{t("title")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 py-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Settings
              </h3>
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={handleApiKeyButtonClick}
                  className="justify-start gap-2 w-full"
                >
                  <Key className="h-4 w-4" />
                  {hasApiKey() ? t("apiKeyReset") : t("apiKeyInput")}
                </Button>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Language</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
    </div>
  );
}
