# Next.js 16 Migration Guide

## 📋 Overview

이 문서는 Express.js + Vanilla JavaScript 기반의 Gemini File Search 프로젝트를 **Next.js 16 + TypeScript + Zustand + Tailwind CSS + shadcn/ui**로 완전히 재구성한 마이그레이션 가이드입니다.

---

## 🎯 Migration Goals

1. ✅ **Next.js 16 최신 권장 구조**로 전환 (App Router)
2. ✅ **Zustand**로 상태관리 통합 (slice 패턴 + persist)
3. ✅ **Tailwind CSS + shadcn/ui** 기반 UI 재구성
4. ✅ **TypeScript strict mode** 적용
5. ✅ **Server Actions + Route Handlers** 중심 데이터 fetching
6. ✅ **다크모드 지원** (next-themes)
7. ✅ **경로 alias** 설정 (@/*)
8. ✅ **ESLint + Prettier** 최신 규칙 적용

---

## 📁 New Project Structure

```
/home/user/Gemini-API-File-Search/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   ├── health/route.ts
│   │   └── stores/
│   │       ├── route.ts          # GET (list), POST (create)
│   │       └── [displayName]/
│   │           ├── route.ts      # GET, DELETE
│   │           ├── query/route.ts
│   │           ├── upload/route.ts
│   │           └── documents/route.ts
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Root page (redirect to /stores)
│   └── globals.css               # Tailwind CSS + custom styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   └── card.tsx
│   └── providers.tsx             # Global providers (Theme, etc.)
│
├── lib/                          # Core business logic
│   ├── gemini.ts                 # Gemini API integration (converted from index.js)
│   └── utils.ts                  # Utility functions
│
├── store/                        # Zustand state management
│   ├── slices/
│   │   ├── uiSlice.ts           # UI state (loading, error)
│   │   ├── storesSlice.ts       # Stores state (with persist)
│   │   ├── documentsSlice.ts    # Documents state
│   │   └── querySlice.ts        # Query history (with persist)
│   └── index.ts                  # Combined store + selectors
│
├── types/                        # TypeScript type definitions
│   ├── gemini.ts                 # Gemini API types
│   ├── api.ts                    # API request/response types
│   ├── store.ts                  # Zustand store types
│   └── index.ts                  # Type exports
│
├── hooks/                        # Custom React hooks (to be added)
│   └── (your custom hooks)
│
├── utils/                        # Utility functions
│   └── (additional utilities)
│
├── public/                       # Static assets
│   └── favicon.ico
│
├── package.json.next             # New package.json (rename to package.json)
├── tsconfig.json                 # TypeScript configuration (strict mode)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── components.json               # shadcn/ui configuration
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .prettierignore               # Prettier ignore patterns
├── .env.local.example            # Environment variables example
└── .gitignore.next               # Updated .gitignore (rename to .gitignore)
```

---

## 🔄 Key Changes Summary

### 1. **Tech Stack Migration**

| Before | After |
|--------|-------|
| Express.js | Next.js 16 App Router |
| Vanilla JavaScript | React 19 + TypeScript 5.7 |
| No state management | Zustand (slice pattern) |
| Custom CSS | Tailwind CSS + shadcn/ui |
| No dark mode | next-themes support |
| CommonJS | ES Modules |

### 2. **Architecture Changes**

#### Backend (Express routes → Next.js Route Handlers)

**Before:**
```javascript
// routes/stores.js
router.get("/", async (req, res) => { ... });
router.post("/", async (req, res) => { ... });
```

**After:**
```typescript
// app/api/stores/route.ts
export async function GET() { ... }
export async function POST(request: NextRequest) { ... }
```

#### Frontend (Vanilla JS → React Components)

**Before:**
```javascript
// public/app.js
async function loadStores() {
  showLoading();
  const data = await fetch("/api/stores").then(r => r.json());
  // Update DOM
}
```

**After:**
```typescript
// app/stores/page.tsx (to be created)
"use client";
export default function StoresPage() {
  const { stores, setStores } = useStoresState();
  const { setLoading } = useUIState();
  // React component logic
}
```

#### State Management (None → Zustand)

**After:**
```typescript
// store/index.ts
export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createUISlice(...args),
      ...createStoresSlice(...args),
      ...createDocumentsSlice(...args),
      ...createQuerySlice(...args),
    }),
    { name: "gemini-file-search-storage" }
  )
);
```

### 3. **Type Safety**

모든 코드가 TypeScript strict mode로 전환되어 컴파일 타임 타입 체크가 가능합니다.

**Example:**
```typescript
// types/gemini.ts
export interface FileSearchStore {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
}

// lib/gemini.ts
export async function createFileSearchStore(
  displayName: string
): Promise<FileSearchStore> {
  // Type-safe implementation
}
```

### 4. **Styling Approach**

**Before (Custom CSS):**
```css
.btn {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
}
```

**After (Tailwind + shadcn/ui):**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">
  Create Store
</Button>
```

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
# Rename new package.json
mv package.json package.json.old
mv package.json.next package.json

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment example
cp .env.local.example .env.local

# Edit .env.local and add your Gemini API key
# GEMINI_API_KEY=your_api_key_here
```

### Step 3: Update .gitignore

```bash
mv .gitignore .gitignore.old
mv .gitignore.next .gitignore
```

### Step 4: Run Development Server

```bash
# Start Next.js dev server with Turbopack
npm run dev
```

Your app will be available at **http://localhost:3000**

### Step 5: Build for Production

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Start production server
npm run start
```

---

## 📝 Detailed Migration Steps

### 1. **Core Business Logic (lib/gemini.ts)**

The original `index.js` Gemini API logic has been converted to TypeScript with full type safety:

**Key improvements:**
- ✅ Type-safe function signatures
- ✅ Error handling with proper types
- ✅ Singleton pattern for AI client
- ✅ Cache management utilities
- ✅ Retry logic with exponential backoff

**Example:**
```typescript
// lib/gemini.ts
export async function createFileSearchStore(
  displayName: string
): Promise<FileSearchStore> {
  const ai = getAI();
  const createStoreOp = await ai.fileSearchStores.create({
    config: { displayName },
  });

  const store: FileSearchStore = {
    name: createStoreOp.name,
    displayName: createStoreOp.displayName,
    createTime: createStoreOp.createTime,
    updateTime: createStoreOp.updateTime,
  };

  setCachedStore(displayName, store);
  return store;
}
```

### 2. **API Route Handlers**

Express routes have been converted to Next.js Route Handlers:

**File mapping:**
- `routes/stores.js` → `app/api/stores/route.ts`
- `routes/query.js` → `app/api/stores/[displayName]/query/route.ts`
- `routes/upload.js` → `app/api/stores/[displayName]/upload/route.ts`
- `routes/documents.js` → `app/api/stores/[displayName]/documents/route.ts`

**Example:**
```typescript
// app/api/stores/route.ts
export async function POST(request: NextRequest) {
  const body: CreateStoreRequest = await request.json();
  const { displayName } = body;

  if (!displayName) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "displayName이 필요합니다" },
      { status: 400 }
    );
  }

  const store = await createFileSearchStore(displayName);
  return NextResponse.json<ApiResponse>({
    success: true,
    data: store,
  });
}
```

### 3. **State Management with Zustand**

Zustand slice pattern provides clean separation of concerns:

**Slices:**
1. **uiSlice** - Loading, error states (not persisted)
2. **storesSlice** - Store list, current store (persisted to localStorage)
3. **documentsSlice** - Document list (not persisted)
4. **querySlice** - Query history (persisted to localStorage)

**Usage in components:**
```typescript
"use client";

import { useStoresState, useUIState } from "@/store";

export function StoresComponent() {
  const { stores, setStores } = useStoresState();
  const { isLoading, setLoading } = useUIState();

  // Component logic
}
```

### 4. **Styling with Tailwind + shadcn/ui**

shadcn/ui provides beautifully designed, accessible components:

**Available components:**
- ✅ Button (with variants: default, destructive, outline, ghost, link)
- ✅ Input (form inputs)
- ✅ Label (form labels)
- ✅ Dialog (modals)
- ✅ Card (content containers)

**Adding more components:**
```bash
# Install shadcn/ui CLI globally (optional)
npx shadcn@latest add [component-name]

# Example: add select component
npx shadcn@latest add select
```

### 5. **Dark Mode Support**

Dark mode is enabled via `next-themes`:

```typescript
// components/theme-toggle.tsx (to be created)
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      Toggle Theme
    </Button>
  );
}
```

---

## ✅ Migration Checklist

### Core Infrastructure
- [x] Next.js 16 configuration
- [x] TypeScript strict mode
- [x] Tailwind CSS + shadcn/ui setup
- [x] Zustand store structure
- [x] ESLint + Prettier
- [x] Type definitions
- [x] Utility functions

### Backend
- [x] Gemini API logic conversion (lib/gemini.ts)
- [x] API Route Handlers
  - [x] Health check
  - [x] Stores CRUD
  - [x] File upload
  - [x] RAG query
  - [x] Documents list
  - [ ] Documents CRUD (delete, update) - **TODO**

### Frontend
- [x] Root layout + providers
- [x] shadcn/ui core components
- [ ] Stores page - **TODO**
- [ ] Workspace page (RAG queries) - **TODO**
- [ ] Documents page - **TODO**
- [ ] Theme toggle component - **TODO**
- [ ] Loading overlay component - **TODO**

### Additional Features
- [ ] Error boundary - **TODO**
- [ ] Toast notifications - **TODO**
- [ ] File upload progress - **TODO**
- [ ] Markdown renderer for query results - **TODO**
- [ ] Document preview - **TODO**

---

## 🔨 Remaining Tasks

### 1. Create Page Components

You need to create React page components to replace the old HTML pages:

#### **app/stores/page.tsx** (replaces public/index.html)
- List all stores
- Create new store modal
- Delete store confirmation
- Navigate to workspace

#### **app/workspace/[storeName]/page.tsx** (replaces public/workspace.html)
- Query input form
- Display query results with markdown
- Show grounding metadata (citations)
- Query history sidebar

#### **app/documents/[storeName]/page.tsx** (replaces public/documents.html)
- List documents in store
- Upload new documents
- Delete documents
- Update documents

### 2. Add Missing shadcn/ui Components

```bash
# Toast notifications
npx shadcn@latest add toast

# Select dropdown
npx shadcn@latest add select

# Progress bar
npx shadcn@latest add progress

# Textarea
npx shadcn@latest add textarea

# Badge
npx shadcn@latest add badge
```

### 3. Implement Server Actions (Optional)

For better UX, you can implement Server Actions for mutations:

```typescript
// app/actions/stores.ts
"use server";

import { createFileSearchStore } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export async function createStoreAction(displayName: string) {
  const store = await createFileSearchStore(displayName);
  revalidatePath("/stores");
  return store;
}
```

### 4. Add Error Handling Components

```tsx
// app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 5. Implement Loading States

```tsx
// app/stores/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner" />
      <p>Loading stores...</p>
    </div>
  );
}
```

---

## 📖 Code Examples

### Example: Stores Page Component

```typescript
// app/stores/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useStoresState, useUIState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StoresPage() {
  const { stores, setStores, isCacheValid } = useStoresState();
  const { isLoading, setLoading, setError } = useUIState();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    // Check cache first
    if (stores.length > 0 && isCacheValid()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stores");
      const data = await response.json();

      if (data.success) {
        setStores(data.data.data);
      } else {
        setError(data.error);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStore() {
    if (!newStoreName.trim()) {
      setError("Store name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newStoreName }),
      });

      const data = await response.json();

      if (data.success) {
        await loadStores(); // Refresh list
        setIsCreateModalOpen(false);
        setNewStoreName("");
      } else {
        setError(data.error);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stores</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Store
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{store.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(store.createTime).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="my-store"
              />
            </div>
            <Button onClick={handleCreateStore} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Module not found errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
# Run type check to see all errors
npm run type-check

# Check tsconfig.json paths are correct
```

### Issue: Styling not applying

**Solution:**
1. Ensure Tailwind is properly configured in `globals.css`
2. Check `tailwind.config.ts` content paths
3. Restart dev server

### Issue: Environment variables not working

**Solution:**
1. Use `.env.local` for local development
2. Prefix client-side variables with `NEXT_PUBLIC_`
3. Restart dev server after changing env vars

---

## 📚 Additional Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

## ✨ Benefits of New Architecture

1. **Type Safety**: Catch errors at compile time with TypeScript
2. **Better DX**: Hot reload, better debugging, type hints
3. **Modern Stack**: Latest React, Next.js, and tooling
4. **Maintainability**: Clear separation of concerns, modular code
5. **Performance**: Server Components, automatic code splitting
6. **Scalability**: Easy to add new features with established patterns
7. **UI Consistency**: shadcn/ui provides consistent, accessible components
8. **State Management**: Zustand provides simple, fast state management
9. **Dark Mode**: Built-in dark mode support
10. **SEO Ready**: Next.js provides SEO optimization out of the box

---

## 🎉 Conclusion

This migration transforms the project from a traditional Express + Vanilla JS stack to a modern, type-safe, React-based application with Next.js 16. The new architecture provides better developer experience, maintainability, and scalability while maintaining all original functionality.

**Next Steps:**
1. Implement the remaining page components (stores, workspace, documents)
2. Add error boundaries and loading states
3. Implement toast notifications
4. Add unit and integration tests
5. Deploy to Vercel or your preferred hosting platform

Happy coding! 🚀
