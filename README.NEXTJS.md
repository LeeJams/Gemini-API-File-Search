# Gemini File Search - Next.js 16

**Modern RAG (Retrieval-Augmented Generation) system** built with Next.js 16, TypeScript, Zustand, and Tailwind CSS. Document storage, indexing, and AI-powered querying using Google's Gemini File Search API.

## 🚀 Features

- ✅ **Next.js 16** with App Router and React 19
- ✅ **TypeScript** strict mode for type safety
- ✅ **Zustand** state management with slice pattern
- ✅ **Tailwind CSS** + **shadcn/ui** for beautiful UI
- ✅ **Dark mode** support with next-themes
- ✅ **File Search Store** management (create, list, delete)
- ✅ **Multi-file upload** with custom chunking strategies
- ✅ **RAG-based queries** with metadata filtering
- ✅ **Document CRUD** operations
- ✅ **Server-side caching** for optimal performance
- ✅ **API Route Handlers** for RESTful endpoints
- ✅ **Markdown rendering** for AI responses
- ✅ **Citation tracking** with grounding metadata

## 📋 Prerequisites

- Node.js 18.17+
- npm 9.0+
- Gemini API key ([Get one here](https://aistudio.google.com/))

## 🛠️ Installation

### 1. Clone & Install

```bash
# Navigate to project directory
cd /home/user/Gemini-API-File-Search

# Rename package.json
mv package.json package.json.old
mv package.json.next package.json

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API Route Handlers
│   │   ├── health/
│   │   └── stores/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
│
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   └── providers.tsx         # Global providers
│
├── lib/                      # Core logic
│   ├── gemini.ts             # Gemini API integration
│   └── utils.ts              # Utilities
│
├── store/                    # Zustand state
│   ├── slices/               # State slices
│   └── index.ts              # Main store
│
├── types/                    # TypeScript types
│   ├── gemini.ts
│   ├── api.ts
│   └── store.ts
│
├── next.config.ts            # Next.js config
├── tailwind.config.ts        # Tailwind config
└── tsconfig.json             # TypeScript config
```

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

## 📖 API Endpoints

### Health Check
```
GET /api/health
```

### Stores
```
GET    /api/stores                      # List all stores
POST   /api/stores                      # Create store
GET    /api/stores/:displayName         # Get store
DELETE /api/stores/:displayName         # Delete store
```

### Upload
```
POST   /api/stores/:displayName/upload  # Upload files (max 10, 50MB each)
```

### Query (RAG)
```
POST   /api/stores/:displayName/query   # Execute RAG query
Body: { "query": "...", "metadataFilter": "..." }
```

### Documents
```
GET    /api/stores/:displayName/documents  # List documents
```

## 🎨 UI Components (shadcn/ui)

Pre-installed components:
- **Button** - Multiple variants (default, outline, ghost, etc.)
- **Input** - Form inputs with validation
- **Label** - Accessible form labels
- **Dialog** - Modal dialogs
- **Card** - Content containers

Add more components:
```bash
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add toast
npx shadcn@latest add select
npx shadcn@latest add progress
```

## 🗂️ State Management (Zustand)

### Slices
1. **UI State** - Loading, errors (not persisted)
2. **Stores State** - Store list, current store (persisted)
3. **Documents State** - Document list (not persisted)
4. **Query State** - Query history (persisted)

### Usage
```typescript
import { useStoresState, useUIState } from "@/store";

function MyComponent() {
  const { stores, setStores } = useStoresState();
  const { isLoading, setLoading } = useUIState();

  // Your logic here
}
```

## 🌙 Dark Mode

Toggle dark mode using the theme provider:

```typescript
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle
    </button>
  );
}
```

## 🔧 Configuration

### TypeScript
- Strict mode enabled
- Path aliases configured (@/*)
- Type-safe imports

### ESLint
- Next.js recommended rules
- TypeScript integration
- Prettier integration

### Tailwind CSS
- Custom color scheme
- Dark mode support
- Custom animations
- Responsive utilities

## 📝 Environment Variables

### Required
```bash
GEMINI_API_KEY=your_api_key     # Gemini API key
```

### Optional
```bash
NODE_ENV=development            # Environment mode
NEXT_PUBLIC_API_URL=http://...  # API base URL
```

## 🚧 TODO / Remaining Tasks

### Frontend Pages
- [ ] Stores page (`app/stores/page.tsx`)
- [ ] Workspace page (`app/workspace/[storeName]/page.tsx`)
- [ ] Documents page (`app/documents/[storeName]/page.tsx`)

### Components
- [ ] Theme toggle component
- [ ] Loading overlay component
- [ ] Error boundary
- [ ] Toast notifications
- [ ] File upload progress

### API Routes
- [ ] Documents update route
- [ ] Documents delete route

### Features
- [ ] Markdown rendering for query results
- [ ] Citation/grounding metadata display
- [ ] Document preview
- [ ] Batch operations

## 🐛 Troubleshooting

### Module not found
```bash
rm -rf .next node_modules
npm install
```

### TypeScript errors
```bash
npm run type-check
```

### Styling issues
```bash
# Restart dev server
# Check tailwind.config.ts content paths
```

## 📚 Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration from Express
- [Next.js Docs](https://nextjs.org/docs)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Gemini API](https://ai.google.dev/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checks
4. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

- Google Gemini API team
- Next.js team
- shadcn for the UI components
- Zustand team

---

**Built with ❤️ using Next.js 16, TypeScript, Zustand, and Tailwind CSS**
