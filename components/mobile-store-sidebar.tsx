"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MessageSquare,
  FileText,
  ChevronLeft,
  Menu,
} from "lucide-react";


interface MobileStoreSidebarProps {
  storeId: string;
  storeName: string;
}

export function MobileStoreSidebar({ storeId, storeName }: MobileStoreSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
    <div className="flex items-center gap-4 border-b p-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="-ml-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
          <SheetHeader className="p-4 text-left border-b">
            <SheetTitle>{storeName}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <div className="px-3 py-2">
              <div className="mb-2 px-4">
                <Link href="/stores" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start pl-0 hover:bg-transparent">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("stores")}
                  </Button>
                </Link>
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <Link key={item.href} href={item.href as any} onClick={() => setOpen(false)}>
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
        </SheetContent>
      </Sheet>
      <h1 className="font-semibold text-lg truncate flex-1">{storeName}</h1>
    </div>
  );
}
