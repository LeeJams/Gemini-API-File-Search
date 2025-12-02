import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModelState } from "@/store";
import { useTranslations } from "next-intl";

interface AdvancedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedSettingsModal({
  open,
  onOpenChange,
}: AdvancedSettingsModalProps) {
  const t = useTranslations("workspace");
  const tCommon = useTranslations("common");
  const {
    systemInstruction,
    setSystemInstruction,
    temperature,
    setTemperature,
    maxOutputTokens,
    setMaxOutputTokens,
    topP,
    setTopP,
    topK,
    setTopK,
    metadataFilter,
    setMetadataFilter,
  } = useModelState();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("advancedOptions")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Metadata Filter */}
          <div className="grid gap-2">
            <Label htmlFor="metadataFilter">{t("metadataFilter")}</Label>
            <Input
              id="metadataFilter"
              placeholder={t("metadataFilterPlaceholder")}
              value={metadataFilter}
              onChange={(e) => setMetadataFilter(e.target.value)}
            />
          </div>

          {/* System Instruction */}
          <div className="grid gap-2">
            <Label htmlFor="systemInstruction">{t("systemInstruction")}</Label>
            <Input
              id="systemInstruction"
              placeholder={t("systemInstructionPlaceholder")}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("systemInstructionHint")}
            </p>
          </div>

          {/* Temperature */}
          <div className="grid gap-2">
            <Label htmlFor="temperature">{t("temperature")}</Label>
            <div className="flex gap-2">
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                placeholder={t("temperaturePlaceholder")}
                value={temperature ?? ""}
                onChange={(e) =>
                  setTemperature(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
              {temperature !== undefined && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTemperature(undefined)}
                >
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("temperatureHint")}
            </p>
          </div>

          {/* Max Output Tokens */}
          <div className="grid gap-2">
            <Label htmlFor="maxOutputTokens">{t("maxOutputTokens")}</Label>
            <div className="flex gap-2">
              <Input
                id="maxOutputTokens"
                type="number"
                min="1"
                placeholder={t("maxOutputTokensPlaceholder")}
                value={maxOutputTokens ?? ""}
                onChange={(e) =>
                  setMaxOutputTokens(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
              {maxOutputTokens !== undefined && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMaxOutputTokens(undefined)}
                >
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("maxOutputTokensHint")}
            </p>
          </div>

          {/* Top P */}
          <div className="grid gap-2">
            <Label htmlFor="topP">{t("topP")}</Label>
            <div className="flex gap-2">
              <Input
                id="topP"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder={t("topPPlaceholder")}
                value={topP ?? ""}
                onChange={(e) =>
                  setTopP(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
              {topP !== undefined && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTopP(undefined)}
                >
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("topPHint")}</p>
          </div>

          {/* Top K */}
          <div className="grid gap-2">
            <Label htmlFor="topK">{t("topK")}</Label>
            <div className="flex gap-2">
              <Input
                id="topK"
                type="number"
                min="1"
                placeholder={t("topKPlaceholder")}
                value={topK ?? ""}
                onChange={(e) =>
                  setTopK(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
              {topK !== undefined && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTopK(undefined)}
                >
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("topKHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{tCommon("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
