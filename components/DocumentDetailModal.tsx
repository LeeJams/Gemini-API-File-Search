import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  File,
  Calendar,
  HardDrive,
  FileType,
  Clock,
  Tag,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { FileSearchDocument } from "@/types";

interface DocumentDetailModalProps {
  document: FileSearchDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 문서 상세 정보 모달
 */
export function DocumentDetailModal({
  document,
  open,
  onOpenChange,
}: DocumentDetailModalProps) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            문서 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Name */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    파일명
                  </p>
                  <p className="text-base font-semibold break-all">
                    {document.displayName}
                  </p>
                </div>

                {/* File Size */}
                {document.sizeBytes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      파일 크기
                    </p>
                    <p className="text-base">
                      {formatFileSize(document.sizeBytes)}
                    </p>
                  </div>
                )}

                {/* MIME Type */}
                {document.mimeType && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <FileType className="h-4 w-4" />
                      파일 타입
                    </p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                      {document.mimeType}
                    </p>
                  </div>
                )}

                {/* Create Time */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    생성일
                  </p>
                  <p className="text-base">{formatDate(document.createTime)}</p>
                </div>

                {/* Update Time */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    수정일
                  </p>
                  <p className="text-base">{formatDate(document.updateTime)}</p>
                </div>
              </div>

              {/* Document Name (Internal ID) */}
              <div className="space-y-1 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">
                  문서 ID
                </p>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                  {document.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  메타데이터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(document.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b last:border-b-0"
                    >
                      <span className="font-medium text-sm text-muted-foreground min-w-[150px]">
                        {key}
                      </span>
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
