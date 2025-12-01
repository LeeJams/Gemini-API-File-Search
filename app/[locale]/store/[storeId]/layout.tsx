"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { StoreSidebar } from "@/components/store-sidebar";
import { MobileStoreSidebar } from "@/components/mobile-store-sidebar";
import { useStoresState, useUIState, useAppStore } from "@/store";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const storeId = decodeURIComponent(params.storeId as string);
  // const t = useTranslations("common");

  const { currentStore, setCurrentStore } = useStoresState();
  const { setLoading, setError, clearError } = useUIState();
  const { apiKey, hasApiKey, _hasHydrated } = useAppStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!hasApiKey()) {
      router.push("/stores");
      return;
    }

    loadStore();
  }, [_hasHydrated, storeId, apiKey]);

  async function loadStore() {
    if (currentStore?.name === storeId) return;

    setLoading(true, "Loading store...");
    clearError();

    try {
      const headers: HeadersInit = {
        "x-api-key": apiKey || "",
      };

      const response = await fetch(`/api/stores/${storeId}`, { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load store");
      }

      setCurrentStore(data.data);
    } catch (error: any) {
      setError(error.message);
      setTimeout(() => router.push("/stores"), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (!currentStore) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileStoreSidebar storeId={storeId} storeName={currentStore.displayName} />
      <StoreSidebar storeId={storeId} className="hidden md:flex" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
