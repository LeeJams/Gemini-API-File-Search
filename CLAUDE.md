# CLAUDE.md - AI Assistant Guide

This document provides comprehensive guidance for AI assistants working on the Gemini API File Search codebase.

## Project Overview

**Name**: Gemini API File Search
**Type**: Full-stack RAG (Retrieval-Augmented Generation) system
**Tech Stack**: Node.js (ES Modules), Express.js, Gemini API, Vanilla JavaScript
**Purpose**: Document storage, indexing, and AI-powered querying using Google's Gemini File Search API

### Key Features
- File Search Store management (create, list, delete)
- Multi-file upload with custom chunking strategies
- RAG-based query execution with metadata filtering
- Document CRUD operations
- Web UI for non-technical users
- RESTful API for programmatic access
- Two-tier caching (server + client)

### Project Modes
1. **CLI Mode**: Run `node index.js` for direct library usage
2. **API Server Mode**: Run `npm run dev` for web service with UI

---

## Architecture

### System Design Pattern
**Layered Architecture** with MVC-like structure:

```
Client Layer (HTML/CSS/JS)
    ↓
Express Server (server.js)
    ↓
Middleware Layer (CORS, Multer, Error Handlers)
    ↓
Route Layer (routes/*.js)
    ↓
Business Logic Layer (index.js)
    ↓
Gemini API Layer (@google/genai)
```

### Component Interactions
- **Client → Server**: REST API via fetch()
- **Routes → Business Logic**: Import functions from index.js
- **Business Logic → Gemini**: Direct SDK calls
- **Caching**: Server-side Map + client-side localStorage

---

## File Structure

```
/home/user/Gemini-API-File-Search/
├── server.js                    # Express app entry point
├── index.js                     # Core business logic & Gemini API wrapper
├── delete.js                    # Utility: manual store deletion
├── package.json                 # Dependencies & scripts
│
├── routes/                      # API route handlers (modular)
│   ├── stores.js               # Store CRUD: /api/stores/*
│   ├── upload.js               # File upload: /api/stores/:name/upload
│   ├── query.js                # RAG queries: /api/stores/:name/query
│   ├── documents.js            # Document CRUD: /api/stores/:name/documents/*
│   └── docs.js                 # Original files: /api/docs/*
│
├── middleware/                  # Express middleware
│   ├── errorHandler.js         # 404 & global error handlers
│   └── upload.js               # Multer configuration (50MB limit, 10 files max)
│
├── utils/                       # Utility functions
│   └── logger.js               # Server startup logging
│
└── public/                      # Static frontend files
    ├── index.html              # Store selection page
    ├── workspace.html          # RAG query workspace
    ├── documents.html          # Document management page
    ├── app.js                  # All frontend logic (global functions)
    └── styles.css              # Global styles

Runtime Directories (auto-created):
├── uploads/                     # Temporary file upload storage
└── docs/                        # Original markdown files (optional)
```

### File Responsibilities

| File | Purpose | Key Exports/Functions |
|------|---------|----------------------|
| `server.js` | Express setup, middleware, route mounting | N/A (entry point) |
| `index.js` | Gemini API wrapper, business logic | `createFileSearchStore`, `uploadMultipleFiles`, `generateContentWithFileSearch`, etc. |
| `routes/*.js` | API endpoint handlers | Express routers |
| `middleware/errorHandler.js` | Error handling | `notFoundHandler`, `errorHandler` |
| `middleware/upload.js` | File upload config | `upload` (Multer instance) |
| `public/app.js` | Frontend logic | Global functions (e.g., `loadStores`, `executeQuery`) |

---

## Development Workflows

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Start Development Server** (auto-restart on changes)
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Web UI: `http://localhost:3000`
   - Health check: `http://localhost:3000/api/health`

### Common Development Tasks

#### Adding a New API Endpoint

1. **Create route file** in `routes/` (e.g., `routes/analytics.js`)
   ```javascript
   import express from "express";
   const router = express.Router();

   router.get("/", async (req, res) => {
     try {
       // Your logic here
       res.json({ success: true, data: result });
     } catch (error) {
       console.error("Error context:", error);
       res.status(500).json({ success: false, error: error.message });
     }
   });

   export default router;
   ```

2. **Mount router** in `server.js`
   ```javascript
   import analyticsRouter from "./routes/analytics.js";
   app.use("/api/analytics", analyticsRouter);
   ```

#### Adding Business Logic Function

1. **Add function** to `index.js`
   ```javascript
   /**
    * Function description
    * @param {Type} param - Description
    * @returns {Promise<Type>} Description
    */
   export async function myNewFunction(param) {
     try {
       // Implementation
       return result;
     } catch (error) {
       console.error("Error:", error);
       throw error;
     }
   }
   ```

2. **Export** at bottom of `index.js`
   ```javascript
   export {
     createFileSearchStore,
     myNewFunction, // Add here
     // ... other exports
   };
   ```

3. **Import in route** file
   ```javascript
   import { myNewFunction } from "../index.js";
   ```

#### Adding Frontend Feature

1. **Add function** to `public/app.js` (global scope)
   ```javascript
   async function myFeature() {
     showLoading();
     try {
       const data = await fetch(`${API_BASE_URL}/endpoint`).then(r => r.json());
       // Update UI
     } catch (error) {
       alert(`Error: ${error.message}`);
     } finally {
       hideLoading();
     }
   }
   ```

2. **Add UI element** in HTML
   ```html
   <button onclick="myFeature()">My Feature</button>
   ```

#### Modifying Gemini API Integration

**Key principles:**
- All Gemini operations are async and require polling
- Use 1-second polling intervals
- Check `operation.done` before proceeding
- Cache store references to minimize API calls

**Example pattern:**
```javascript
let operation = await ai.fileSearchStores.someOperation({ config });
while (!operation.done) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  operation = await ai.operations.get({ operation });
}
return operation.result;
```

### Testing Workflow

**Manual Testing:**
1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Test workflow: Create Store → Upload Files → Execute Query

**API Testing with curl:**
```bash
# Create store
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{"displayName": "test-store"}'

# Upload file
curl -X POST http://localhost:3000/api/stores/test-store/upload \
  -F "files=@./docs/test.txt"

# Execute query
curl -X POST http://localhost:3000/api/stores/test-store/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Summarize the documents"}'
```

### Git Workflow

**Current Branch**: `claude/claude-md-mi3r0plqp0hkwm5n-016coPPneZ5sHkKRT2MzkuC9`

**When making changes:**
1. Develop on the designated feature branch
2. Commit with descriptive messages
3. Push to origin with `-u` flag: `git push -u origin <branch-name>`
4. Branch name MUST start with `claude/` and match session ID

**Commit Message Style** (from git log):
- Korean language
- Descriptive and detailed
- Focus on what changed and why

---

## Code Conventions and Patterns

### Backend Patterns

#### 1. ES Modules (Required)
```javascript
// ✅ Correct
import express from "express";
export { myFunction };

// ❌ Wrong
const express = require("express");
module.exports = { myFunction };
```

**__dirname workaround:**
```javascript
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

#### 2. Async/Await with Try-Catch (Required)
**Every route handler must follow this pattern:**
```javascript
router.method("/path", async (req, res) => {
  try {
    // 1. Validation
    if (!req.body.required) {
      return res.status(400).json({
        success: false,
        error: "Validation error message"
      });
    }

    // 2. Business logic
    const result = await someAsyncFunction();

    // 3. Success response
    res.json({
      success: true,
      message: "Operation description",
      data: result
    });
  } catch (error) {
    // 4. Error logging
    console.error("Context-specific message:", error);

    // 5. Error response
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

#### 3. Response Format Convention (Required)
**Success:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { "key": "value" }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

#### 4. Polling Pattern for Gemini Operations
```javascript
let operation = await ai.fileSearchStores.uploadToFileSearchStore({...});
while (!operation.done) {
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1s interval
  operation = await ai.operations.get({ operation });
}
// Now operation is complete
```

#### 5. Pagination Pattern for Lists
```javascript
let pager = await ai.fileSearchStores.list({ config: { pageSize: 10 } });
let page = pager.page;
const allItems = [];

while (true) {
  for (const item of page) {
    allItems.push(item);
  }
  if (!pager.hasNextPage()) break;
  page = await pager.nextPage();
}

return allItems;
```

#### 6. Modular Router Pattern
```javascript
// routes/myroute.js
import express from "express";
const router = express.Router();

router.get("/", handler1);
router.post("/", handler2);

export default router;

// server.js
import myRouter from "./routes/myroute.js";
app.use("/api/myroute", myRouter);
```

### Frontend Patterns

#### 1. Global Function Approach (Required)
All functions in `app.js` must be global (no module scope):
```javascript
// ✅ Correct
async function loadStores() {
  // Can be called from HTML onclick
}

// ❌ Wrong
const loadStores = () => {
  // Arrow functions work but use function declaration for consistency
};
```

#### 2. Loading State Management (Required)
```javascript
showLoading();
try {
  const result = await apiCall();
  // Success handling
} catch (error) {
  // Error handling
  alert(`Error: ${error.message}`);
} finally {
  hideLoading(); // Always hide, even on error
}
```

#### 3. Modal Pattern
```javascript
function openMyModal() {
  document.getElementById("my-modal-id").classList.remove("hidden");
}

function closeMyModal() {
  document.getElementById("my-modal-id").classList.add("hidden");
}

// HTML
<div id="my-modal-id" class="modal hidden">
  <button onclick="closeMyModal()">Close</button>
</div>
```

#### 4. Security: HTML Escaping (Required)
**Always escape user-generated content:**
```javascript
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text; // Auto-escapes
  return div.innerHTML;
}

// Usage
container.innerHTML = `<div>${escapeHtml(userInput)}</div>`;
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Routes (URLs) | kebab-case | `/api/stores`, `/api/file-search` |
| Functions | camelCase | `createFileSearchStore()` |
| Variables | camelCase | `const storeCache = new Map()` |
| Constants | UPPER_SNAKE_CASE | `const API_BASE_URL = "..."` |
| Files | kebab-case | `error-handler.js`, `upload.js` |
| CSS Classes | kebab-case | `.modal-content`, `.btn-primary` |

### Error Handling Guidelines

#### Backend Error Handling

1. **Route-level validation**
   ```javascript
   if (!displayName || !displayName.trim()) {
     return res.status(400).json({
       success: false,
       error: "displayName is required"
     });
   }
   ```

2. **Specific status codes**
   ```javascript
   // 400: Bad request (validation)
   // 403: Forbidden (security)
   // 404: Not found
   // 500: Internal server error
   // 503: Service unavailable (Gemini overload)
   ```

3. **Context-specific logging**
   ```javascript
   console.error("Failed to upload file:", error);
   console.error("Store not found:", displayName, error);
   ```

4. **File cleanup on error**
   ```javascript
   try {
     await processFile(file.path);
   } catch (error) {
     // Clean up temp file even on error
     if (fs.existsSync(file.path)) {
       fs.unlinkSync(file.path);
     }
     throw error;
   }
   ```

#### Frontend Error Handling

1. **User-friendly messages**
   ```javascript
   catch (error) {
     // Show to user
     alert(`파일 업로드 실패: ${error.message}`);
     // Also log for debugging
     console.error("Upload error:", error);
   }
   ```

2. **Empty state handling**
   ```javascript
   if (items.length === 0) {
     container.innerHTML = `
       <div class="empty-state">
         <div class="empty-icon">📭</div>
         <div class="empty-title">No items found</div>
       </div>
     `;
     return;
   }
   ```

### Security Patterns

#### 1. Path Traversal Prevention
```javascript
const normalizedPath = path.normalize(requestedPath);
const basePath = path.resolve(__dirname, "docs");

if (!normalizedPath.startsWith(basePath)) {
  return res.status(403).json({
    success: false,
    error: "Invalid file path"
  });
}
```

#### 2. XSS Prevention
- Always use `escapeHtml()` for user input
- Never use `innerHTML` with unsanitized data
- Prefer `textContent` when possible

#### 3. Input Validation
- Validate all required fields
- Check data types
- Sanitize file names
- Validate metadata filters

---

## Important Technical Details

### Environment Configuration

**Required:**
```bash
GEMINI_API_KEY=your_api_key_here  # Get from Google AI Studio
```

**Optional:**
```bash
PORT=3000  # Default: 3000
```

### API Endpoints Reference

#### Store Management
```
POST   /api/stores                           # Create store
GET    /api/stores                           # List all stores
GET    /api/stores/:displayName              # Get store details
DELETE /api/stores/:displayName              # Delete store
```

#### File Upload
```
POST   /api/stores/:displayName/upload       # Upload files (max 10)
       Content-Type: multipart/form-data
       Body: files[] (FormData)
```

#### Query (RAG)
```
POST   /api/stores/:displayName/query        # Execute RAG query
       Content-Type: application/json
       Body: {
         "query": "Your question here",
         "metadataFilter": "doc_type='manual'" // Optional
       }
```

#### Document Management
```
GET    /api/stores/:displayName/documents           # List documents
GET    /api/stores/:displayName/documents/:doc      # Get document
DELETE /api/stores/:displayName/documents/:doc      # Delete document
PUT    /api/stores/:displayName/documents/:doc      # Update document
       Content-Type: multipart/form-data
       Body: file (FormData)
```

#### Original Files
```
GET    /api/docs/files                       # List .md files in docs/
GET    /api/docs/file/:filename              # Read file content
```

### Caching Strategy

#### Server-Side Cache (index.js)
```javascript
const storeCache = new Map(); // Key: displayName, Value: store object

// Cache-first strategy
function findStoreByDisplayName(displayName) {
  // 1. Check cache
  const cached = getCachedStore(displayName);
  if (cached) return cached;

  // 2. Fetch from API
  const store = await /* API call */;

  // 3. Store in cache
  setCachedStore(displayName, store);
  return store;
}
```

**Lifecycle:**
- **Set**: On store creation or first fetch
- **Get**: On every `findStoreByDisplayName()` call
- **Delete**: On store deletion
- **Persistence**: None (cleared on server restart)

#### Client-Side Cache (app.js)
```javascript
const STORES_CACHE_KEY = "gemini_file_search_stores_cache";
const STORES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache format
{
  "timestamp": 1234567890,
  "data": [/* stores array */]
}
```

**Use cache when:**
- Timestamp is less than 5 minutes old
- Reduces API calls on page refresh

### File Upload Constraints

| Setting | Value | Location |
|---------|-------|----------|
| Max file size | 50 MB | `middleware/upload.js` |
| Max files per upload | 10 | `routes/upload.js` |
| Temporary storage | `uploads/` | Auto-created |
| Cleanup | Immediate | After Gemini upload |

### Gemini API Configuration

**Model Used**: `gemini-2.5-flash`

**System Instruction** (Korean):
```
답변은 md형식으로 작성해주세요.
구조화된 데이터는 표로 작성해주세요.
모든 답변은 한국어로 해주세요.
```

**API Limits:**
- Max File Search Stores: 10 per project
- Indexing cost: $0.15 per 1M tokens
- Polling interval: 1 second
- Page size (lists): 10 items

### MIME Type Detection

**Supported types** (in `uploadWithCustomChunking()`):
```javascript
const mimeMap = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".json": "application/json",
  ".html": "text/html"
};
```

### Data Flow: Upload → Query

**Upload Flow:**
1. User selects files in `documents.html`
2. `uploadFiles()` creates FormData
3. POST to `/api/stores/:name/upload`
4. Multer saves to `uploads/` with unique names
5. Loop through files:
   - Call `uploadWithCustomChunking(store, path, options)`
   - Gemini API uploads and indexes
   - Poll every 1s until `operation.done === true`
   - Delete temp file with `fs.unlinkSync()`
6. Return results (success/error per file)
7. Frontend refreshes document list

**Query Flow:**
1. User enters query in `workspace.html`
2. `executeQuery()` sends POST to `/api/stores/:name/query`
3. Backend finds store (cache-first)
4. Call `generateContentWithFileSearch(store, query, filter)`
5. Gemini API:
   - Semantic search on indexed documents
   - Retrieve relevant chunks
   - Generate answer using context
   - Return text + grounding metadata
6. Frontend renders markdown with citations
7. Citations clickable via `openGroundingContext(index)`

---

## Common Pitfalls and Solutions

### Problem: "Store not found" error
**Cause**: Store was deleted or cache is stale
**Solution**:
- Clear cache: Delete from `storeCache` in index.js
- Verify store exists: Check Gemini API console
- Recreate store: Use POST `/api/stores`

### Problem: Files not uploading
**Cause**: File size > 50MB or incorrect FormData
**Solution**:
- Check file size in frontend before upload
- Ensure FormData key is `files` (plural)
- Check Multer middleware is mounted

### Problem: RAG query returns irrelevant results
**Cause**: Poor document chunking or metadata filter
**Solution**:
- Adjust chunking params: `maxTokensPerChunk`, `maxOverlapTokens`
- Use metadata filters to narrow search scope
- Ensure documents are properly indexed (check `operation.done`)

### Problem: "CORS error" in browser
**Cause**: CORS middleware not configured
**Solution**: Verify `app.use(cors())` is in server.js before routes

### Problem: Frontend not updating after changes
**Cause**: Browser cache or old JavaScript
**Solution**:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear localStorage: `localStorage.clear()` in console
- Check Network tab for 304 responses

### Problem: Gemini API "503 Service Unavailable"
**Cause**: API overload or rate limiting
**Solution**:
- Implement exponential backoff
- Show user-friendly message (already handled in query.js)
- Wait and retry later

---

## Debugging Guide

### Backend Debugging

**Enable detailed logging:**
```javascript
console.log("Variable state:", JSON.stringify(variable, null, 2));
console.log("Request body:", req.body);
console.log("Request params:", req.params);
```

**Check Gemini API operations:**
```javascript
console.log("Operation status:", operation.done);
console.log("Operation response:", operation.response);
```

**Verify cache state:**
```javascript
console.log("Cache contents:", Array.from(storeCache.entries()));
```

### Frontend Debugging

**Check API responses:**
```javascript
const response = await fetch(url);
const data = await response.json();
console.log("API response:", data);
```

**Verify global state:**
```javascript
console.log("Current store:", window.CURRENT_STORE);
console.log("Grounding metadata:", window.LAST_GROUNDING_METADATA);
```

**Check localStorage:**
```javascript
console.log("Cache:", localStorage.getItem(STORES_CACHE_KEY));
```

### Network Debugging

**Use browser DevTools:**
1. Open Network tab
2. Filter by Fetch/XHR
3. Check request/response headers
4. Verify payload format

**Test API with curl:**
```bash
curl -v http://localhost:3000/api/stores
```

---

## Extension Points

### Adding New Features

#### 1. Add Metadata Filtering UI
- **File**: `public/workspace.html`, `public/app.js`
- **Backend**: Already supports `metadataFilter` parameter
- **Task**: Add UI controls for common filters

#### 2. Implement Store Search
- **File**: `routes/stores.js`, `public/app.js`
- **API**: Add query parameter to GET `/api/stores?search=term`
- **Logic**: Filter stores by displayName client-side or server-side

#### 3. Add Document Preview
- **File**: `routes/documents.js`, `public/documents.html`
- **API**: Add GET `/api/stores/:name/documents/:doc/preview`
- **Logic**: Return first N characters or generate thumbnail

#### 4. Implement Batch Delete
- **File**: `routes/documents.js`, `public/app.js`
- **API**: Add DELETE `/api/stores/:name/documents` with body `{ documentNames: [] }`
- **Logic**: Loop and delete, return batch results

#### 5. Add Query History
- **File**: `public/app.js`, localStorage
- **Logic**: Store queries in localStorage, display in sidebar
- **UI**: Add "Recent Queries" section in workspace

### Optimization Opportunities

1. **Implement Redis Cache**: Replace in-memory Map with Redis for multi-instance support
2. **Add Request Queue**: Prevent concurrent uploads to same store
3. **Optimize Pagination**: Implement cursor-based pagination for large datasets
4. **Add Streaming**: Stream large file uploads and query responses
5. **Implement WebSockets**: Real-time updates for long-running operations

---

## Language and Localization

**Primary Language**: Korean (한국어)

**Key locations:**
- User-facing messages: Korean in routes, frontend
- Code comments: Mixed Korean/English
- Console logs: Mixed Korean/English
- README.md: Korean
- API error messages: Korean

**For AI Assistants:**
- Maintain Korean for user-facing text
- Use English for code comments (optional, but preferred for international collaboration)
- Keep console logs in Korean for consistency

---

## Dependencies

### Production Dependencies
```json
{
  "@google/genai": "^1.29.1",    // Gemini API SDK
  "dotenv": "^16.4.5",            // Environment variables
  "express": "^4.18.2",           // Web server
  "multer": "^1.4.5-lts.1",       // File upload
  "cors": "^2.8.5"                // CORS middleware
}
```

### Frontend Dependencies (CDN)
- **marked.js** v11.1.1: Markdown parser
  - URL: `https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js`

**No build step required** - all frontend dependencies loaded via CDN.

---

## Best Practices for AI Assistants

### When Modifying Code

1. **Read before editing**: Always read the file before making changes
2. **Follow patterns**: Maintain existing code style and patterns
3. **Test endpoints**: Verify API endpoints work after changes
4. **Update documentation**: Update this file if you change architecture
5. **Preserve language**: Keep Korean text in Korean, don't translate

### When Adding Features

1. **Check existing code**: Similar functionality may already exist
2. **Use caching**: Leverage existing cache mechanisms
3. **Handle errors**: Follow established error handling patterns
4. **Validate inputs**: Always validate user inputs
5. **Clean up resources**: Delete temp files, close connections

### When Debugging

1. **Check logs first**: Most errors are logged to console
2. **Verify environment**: Ensure .env is configured correctly
3. **Test with curl**: Isolate frontend vs backend issues
4. **Check Gemini API**: Verify API key and quotas
5. **Clear cache**: Try clearing server and client caches

### When Committing

1. **Descriptive messages**: Explain what and why in Korean
2. **Test locally**: Run `npm run dev` and test changes
3. **Check git status**: Ensure you're on correct branch
4. **Push with -u**: Use `git push -u origin <branch-name>`
5. **Branch naming**: Must start with `claude/` and match session ID

---

## Quick Reference

### Start Development
```bash
npm install          # Install dependencies
npm run dev         # Start with auto-restart
```

### Test API
```bash
# Health check
curl http://localhost:3000/api/health

# Create store
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{"displayName": "test"}'

# Upload file
curl -X POST http://localhost:3000/api/stores/test/upload \
  -F "files=@./docs/test.txt"

# Query
curl -X POST http://localhost:3000/api/stores/test/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Summarize"}'
```

### Common Code Snippets

**Add new route:**
```javascript
// routes/myroute.js
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

**Call Gemini API:**
```javascript
import { ai } from "./index.js"; // Get client instance

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Your prompt",
  config: { /* options */ }
});
```

**Frontend API call:**
```javascript
async function myFunction() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/endpoint`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    // Handle success
  } catch (error) {
    alert(`오류: ${error.message}`);
  } finally {
    hideLoading();
  }
}
```

---

## Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Tutorial**: https://www.philschmid.de/gemini-file-search-javascript
- **Google AI Studio**: https://aistudio.google.com/
- **Express.js Docs**: https://expressjs.com/
- **Multer Docs**: https://github.com/expressjs/multer

---

## Changelog

### 2025-11-17
- Initial CLAUDE.md creation
- Documented complete architecture and patterns
- Added comprehensive development workflows
- Included troubleshooting guide

---

**Last Updated**: 2025-11-17
**Maintained By**: AI Assistants working on this codebase
**Purpose**: Enable effective collaboration and maintain code quality
