import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["ko", "en", "zh", "ja"],

  // Used when no locale matches
  defaultLocale: "ko",

  // The `pathnames` object can be used to map internal routes to localized routes
  pathnames: {
    "/": "/",
    "/stores": "/stores",
    "/workspace/[storeId]": "/workspace/[storeId]",
    "/documents/[storeId]": "/documents/[storeId]",
  },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
