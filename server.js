import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import {
  createFileSearchStore,
  findStoreByDisplayName,
  uploadMultipleFiles,
  uploadWithCustomChunking,
  generateContentWithFileSearch,
  findDocumentByDisplayName,
  deleteDocument,
  updateDocument,
  deleteFileSearchStore,
} from "./index.js";
import { GoogleGenAI } from "@google/genai";

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config();

// GoogleGenAI 클라이언트 초기화
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 제한
});

// ============================================
// API 엔드포인트
// ============================================

/**
 * 헬스 체크
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Gemini File Search API 서버가 실행 중입니다",
    version: "1.0.0",
  });
});

/**
 * 1. 스토어 생성
 * POST /api/stores
 * Body: { displayName: string }
 */
app.post("/api/stores", async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        error: "displayName이 필요합니다",
      });
    }

    const store = await createFileSearchStore(displayName);

    res.json({
      success: true,
      message: "스토어가 생성되었습니다",
      data: {
        name: store.name,
        displayName: store.displayName,
      },
    });
  } catch (error) {
    console.error("스토어 생성 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 2. 스토어 목록 조회
 * GET /api/stores
 */
app.get("/api/stores", async (req, res) => {
  try {
    const stores = [];
    const pager = await ai.fileSearchStores.list({ config: { pageSize: 20 } });
    let page = pager.page;

    while (true) {
      for (const store of page) {
        stores.push({
          name: store.name,
          displayName: store.displayName,
          createTime: store.createTime,
          updateTime: store.updateTime,
        });
      }
      if (!pager.hasNextPage()) break;
      page = await pager.nextPage();
    }

    res.json({
      success: true,
      data: stores,
      count: stores.length,
    });
  } catch (error) {
    console.error("스토어 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 3. 특정 스토어 조회
 * GET /api/stores/:displayName
 */
app.get("/api/stores/:displayName", async (req, res) => {
  try {
    const { displayName } = req.params;
    const store = await findStoreByDisplayName(displayName);

    res.json({
      success: true,
      data: {
        name: store.name,
        displayName: store.displayName,
        createTime: store.createTime,
        updateTime: store.updateTime,
      },
    });
  } catch (error) {
    console.error("스토어 조회 오류:", error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 4. 스토어 삭제
 * DELETE /api/stores/:displayName
 */
app.delete("/api/stores/:displayName", async (req, res) => {
  try {
    const { displayName } = req.params;
    const store = await findStoreByDisplayName(displayName);
    await deleteFileSearchStore(store);

    res.json({
      success: true,
      message: "스토어가 삭제되었습니다",
    });
  } catch (error) {
    console.error("스토어 삭제 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 5. 파일 업로드 (단일 또는 다중)
 * POST /api/stores/:displayName/upload
 * FormData: files (single or multiple)
 * Optional Body: { customMetadata, maxTokensPerChunk, maxOverlapTokens }
 */
app.post(
  "/api/stores/:displayName/upload",
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { displayName } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "업로드할 파일이 없습니다",
        });
      }

      const store = await findStoreByDisplayName(displayName);

      // 업로드된 파일들 처리
      const uploadResults = [];
      for (const file of files) {
        try {
          const options = {};
          if (req.body.customMetadata) {
            options.customMetadata = JSON.parse(req.body.customMetadata);
          }
          if (req.body.maxTokensPerChunk) {
            options.maxTokensPerChunk = parseInt(req.body.maxTokensPerChunk);
          }
          if (req.body.maxOverlapTokens) {
            options.maxOverlapTokens = parseInt(req.body.maxOverlapTokens);
          }

          const result =
            Object.keys(options).length > 0
              ? await uploadWithCustomChunking(store, file.path, options)
              : await uploadMultipleFiles(store, path.dirname(file.path));

          uploadResults.push({
            filename: file.originalname,
            status: "success",
          });

          // 업로드 후 임시 파일 삭제
          fs.unlinkSync(file.path);
        } catch (error) {
          uploadResults.push({
            filename: file.originalname,
            status: "error",
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: "파일 업로드가 완료되었습니다",
        data: uploadResults,
      });
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * 6. 쿼리 실행 (RAG)
 * POST /api/stores/:displayName/query
 * Body: { query: string, metadataFilter?: string }
 */
app.post("/api/stores/:displayName/query", async (req, res) => {
  try {
    const { displayName } = req.params;
    const { query, metadataFilter } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "query가 필요합니다",
      });
    }

    const store = await findStoreByDisplayName(displayName);
    const response = await generateContentWithFileSearch(
      store,
      query,
      metadataFilter || null
    );

    res.json({
      success: true,
      data: {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
      },
    });
  } catch (error) {
    console.error("쿼리 실행 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 7. 스토어 내 문서 목록 조회
 * GET /api/stores/:displayName/documents
 */
app.get("/api/stores/:displayName/documents", async (req, res) => {
  try {
    const { displayName } = req.params;
    const store = await findStoreByDisplayName(displayName);

    const documents = [];
    let documentPager = await ai.fileSearchStores.documents.list({
      parent: store.name,
    });

    while (true) {
      for (const doc of documentPager.page) {
        documents.push({
          name: doc.name,
          displayName: doc.displayName,
          createTime: doc.createTime,
          updateTime: doc.updateTime,
        });
      }
      if (!documentPager.hasNextPage()) break;
      documentPager = await documentPager.nextPage();
    }

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("문서 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 8. 특정 문서 조회
 * GET /api/stores/:displayName/documents/:docDisplayName
 */
app.get(
  "/api/stores/:displayName/documents/:docDisplayName",
  async (req, res) => {
    try {
      const { displayName, docDisplayName } = req.params;
      const store = await findStoreByDisplayName(displayName);
      const document = await findDocumentByDisplayName(store, docDisplayName);

      res.json({
        success: true,
        data: {
          name: document.name,
          displayName: document.displayName,
          createTime: document.createTime,
          updateTime: document.updateTime,
        },
      });
    } catch (error) {
      console.error("문서 조회 오류:", error);
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * 9. 문서 삭제
 * DELETE /api/stores/:displayName/documents/:docDisplayName
 */
app.delete(
  "/api/stores/:displayName/documents/:docDisplayName",
  async (req, res) => {
    try {
      const { displayName, docDisplayName } = req.params;
      const store = await findStoreByDisplayName(displayName);
      const document = await findDocumentByDisplayName(store, docDisplayName);
      await deleteDocument(document);

      res.json({
        success: true,
        message: "문서가 삭제되었습니다",
      });
    } catch (error) {
      console.error("문서 삭제 오류:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * 10. 문서 업데이트
 * PUT /api/stores/:displayName/documents/:docDisplayName
 * FormData: file
 */
app.put(
  "/api/stores/:displayName/documents/:docDisplayName",
  upload.single("file"),
  async (req, res) => {
    try {
      const { displayName, docDisplayName } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "업데이트할 파일이 없습니다",
        });
      }

      const store = await findStoreByDisplayName(displayName);
      await updateDocument(store, docDisplayName, file.path);

      // 업로드 후 임시 파일 삭제
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        message: "문서가 업데이트되었습니다",
      });
    } catch (error) {
      console.error("문서 업데이트 오류:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "요청한 엔드포인트를 찾을 수 없습니다",
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error("서버 오류:", err);
  res.status(500).json({
    success: false,
    error: err.message || "서버 내부 오류가 발생했습니다",
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`\n🚀 Gemini File Search API 서버가 시작되었습니다`);
  console.log(`📡 서버 주소: http://localhost:${PORT}`);
  console.log(`📚 API 문서: http://localhost:${PORT}/`);
  console.log(`\n사용 가능한 엔드포인트:`);
  console.log(
    `  GET    /                                          - 헬스 체크`
  );
  console.log(
    `  POST   /api/stores                                - 스토어 생성`
  );
  console.log(
    `  GET    /api/stores                                - 스토어 목록`
  );
  console.log(
    `  GET    /api/stores/:displayName                   - 스토어 조회`
  );
  console.log(
    `  DELETE /api/stores/:displayName                   - 스토어 삭제`
  );
  console.log(
    `  POST   /api/stores/:displayName/upload            - 파일 업로드`
  );
  console.log(
    `  POST   /api/stores/:displayName/query             - 쿼리 실행 (RAG)`
  );
  console.log(
    `  GET    /api/stores/:displayName/documents         - 문서 목록`
  );
  console.log(
    `  GET    /api/stores/:displayName/documents/:doc    - 문서 조회`
  );
  console.log(
    `  DELETE /api/stores/:displayName/documents/:doc    - 문서 삭제`
  );
  console.log(
    `  PUT    /api/stores/:displayName/documents/:doc    - 문서 업데이트\n`
  );
});
