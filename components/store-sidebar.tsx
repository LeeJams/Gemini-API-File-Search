"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  FileText,
  ChevronLeft,
} from "lucide-react";

interface StoreSidebarProps {
  storeId: string;
  className?: string;
}

export function StoreSidebar({ storeId, className }: StoreSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const tWorkspace = useTranslations("workspace");
  const tDocuments = useTranslations("documents");

  const items = [
    {
      title: tWorkspace("title"),
      href: `/store/${storeId}/workspace`,
      icon: MessageSquare,
    },
    {
      title: tDocuments("title"),
      href: `/store/${storeId}/documents`,
      icon: FileText,
    },
  ];

  return (
    <div className={cn("pb-12 w-64 border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-2 px-4">
             <Link href="/stores">
              <Button variant="ghost" size="sm" className="w-full justify-start pl-0 hover:bg-transparent">
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("stores")}
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <Link key={item.href} href={item.href as any}>
                <Button
                  variant={pathname?.startsWith(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
