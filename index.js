import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ============================================
// 환경 설정 및 초기화
// ============================================

/**
 * ES 모듈에서 __dirname 사용을 위한 설정
 * CommonJS의 __dirname을 ES 모듈에서 사용하기 위한 변환
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 환경 변수 로드 (.env 파일에서 환경 변수 읽기)
 */
dotenv.config();

/**
 * GoogleGenAI 클라이언트 초기화
 * Gemini API를 사용하기 위한 클라이언트 인스턴스 생성
 */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * 스토어 캐시 (서버 메모리)
 *
 * displayName을 키로, 실제 File Search Store 객체를 캐싱합니다.
 * 같은 스토어에 대해 반복해서 Gemini API를 호출하는 것을 방지합니다.
 */
const storeCache = new Map();

/**
 * 스토어 캐시에서 조회
 *
 * @param {string} displayName - 스토어 표시 이름
 * @returns {Object|null} 캐시된 스토어 또는 null
 */
function getCachedStore(displayName) {
  const cached = storeCache.get(displayName);
  if (!cached) return null;
  return cached;
}

/**
 * 스토어 캐시에 저장
 *
 * @param {string} displayName - 스토어 표시 이름
 * @param {Object} store - 스토어 객체
 */
function setCachedStore(displayName, store) {
  if (!displayName || !store) return;
  storeCache.set(displayName, store);
}

// ============================================
// File Search Store 관리 함수
// ============================================

/**
 * File Search Store 생성
 *
 * Gemini File Search API에서 문서를 저장하고 검색할 수 있는 스토어를 생성합니다.
 *
 * @param {string} displayName - 스토어의 표시 이름
 * @returns {Promise<Object>} 생성된 스토어 정보 (name, displayName 등)
 */
async function createFileSearchStore(displayName) {
  console.log(`\n📦 파일 검색 스토어 생성 중: ${displayName}`);

  const createStoreOp = await ai.fileSearchStores.create({
    config: { displayName },
  });

  console.log(`✅ 스토어가 생성되었습니다: ${createStoreOp.name}`);
  // 새로 생성된 스토어는 캐시에 바로 저장해 둡니다.
  setCachedStore(displayName, createStoreOp);
  return createStoreOp;
}

/**
 * Display Name으로 Store 찾기
 *
 * 표시 이름을 기준으로 기존에 생성된 File Search Store를 검색합니다.
 * 여러 페이지에 걸쳐 검색하며, 찾지 못하면 에러를 발생시킵니다.
 *
 * @param {string} displayName - 찾을 스토어의 표시 이름
 * @returns {Promise<Object>} 찾은 스토어 정보
 * @throws {Error} 스토어를 찾을 수 없을 경우
 */
async function findStoreByDisplayName(displayName) {
  // 1. 캐시 먼저 조회
  const cached = getCachedStore(displayName);
  if (cached) {
    console.log(`\n🔍 스토어 캐시 히트: ${displayName} -> ${cached.name}`);
    return cached;
  }

  console.log(`\n🔍 스토어 검색 중(원격): ${displayName}`);

  let fileStore = null;
  const pager = await ai.fileSearchStores.list({ config: { pageSize: 10 } });
  let page = pager.page;

  searchLoop: while (true) {
    for (const store of page) {
      if (store.displayName === displayName) {
        fileStore = store;
        break searchLoop;
      }
    }
    if (!pager.hasNextPage()) break;
    page = await pager.nextPage();
  }

  if (!fileStore) {
    throw new Error(`'${displayName}' 이름의 스토어를 찾을 수 없습니다.`);
  }

  console.log(`✅ 스토어를 찾았습니다: ${fileStore.name}`);
  // 2. 찾은 스토어를 캐시에 저장
  setCachedStore(displayName, fileStore);
  return fileStore;
}

// ============================================
// 파일 업로드 함수
// ============================================

/**
 * 여러 파일 동시 업로드
 *
 * 지정된 디렉토리 내의 모든 파일을 File Search Store에 업로드하고 인덱싱합니다.
 * 파일들은 병렬로 업로드되며, 각 파일의 처리 완료를 기다립니다.
 *
 * @param {Object} fileStore - 업로드할 대상 스토어 객체
 * @param {string} docsDir - 업로드할 파일들이 있는 디렉토리 경로
 * @returns {Promise<Array>} 업로드 완료된 파일들의 operation 결과 배열
 */
async function uploadMultipleFiles(fileStore, docsDir) {
  console.log(`\n📤 파일 업로드 중: ${docsDir}`);

  if (!fs.existsSync(docsDir)) {
    console.warn(`⚠️  ${docsDir} 디렉토리가 존재하지 않습니다. 생성하는 중...`);
    fs.mkdirSync(docsDir, { recursive: true });
    return;
  }

  const files = fs
    .readdirSync(docsDir)
    .filter((file) => fs.statSync(path.join(docsDir, file)).isFile())
    .map((file) => path.join(docsDir, file));

  if (files.length === 0) {
    console.warn(`⚠️  ${docsDir}에 파일이 없습니다`);
    return [];
  }

  const uploadPromises = files.map(async (filePath) => {
    try {
      // 1. 업로드 및 인덱싱 시작
      let operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: filePath,
        fileSearchStoreName: fileStore.name,
        config: {
          displayName: path.basename(filePath),
        },
      });

      // 2. 문서가 완전히 처리될 때까지 폴링
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
        operation = await ai.operations.get({ operation });
      }

      console.log(`✅ 처리 완료: ${path.basename(filePath)}`);
      return operation;
    } catch (error) {
      console.error(
        `❌ 업로드 오류 ${path.basename(filePath)}:`,
        error.message
      );
      throw error;
    }
  });

  return await Promise.all(uploadPromises);
}

/**
 * 커스텀 청킹 전략으로 파일 업로드
 *
 * 문서를 청크(chunk)로 나누는 방식을 커스터마이징하여 업로드합니다.
 * 청킹 설정을 통해 검색 정확도와 성능을 최적화할 수 있습니다.
 *
 * @param {Object} fileStore - 업로드할 대상 스토어 객체
 * @param {string} filePath - 업로드할 파일의 경로
 * @param {Object} options - 업로드 옵션
 * @param {string} [options.displayName] - 파일의 표시 이름 (기본값: 파일명)
 * @param {Array} [options.customMetadata] - 커스텀 메타데이터 배열
 * @param {number} [options.maxTokensPerChunk=500] - 청크당 최대 토큰 수
 * @param {number} [options.maxOverlapTokens=50] - 청크 간 최대 겹치는 토큰 수
 * @param {string} [options.mimeType] - 파일 MIME 타입 (예: 'text/markdown')
 * @returns {Promise<Object>} 업로드 완료된 파일의 operation 결과
 */
async function uploadWithCustomChunking(fileStore, filePath, options = {}) {
  console.log(`\n📄 커스텀 청킹으로 업로드 중: ${filePath}`);

  const {
    displayName = path.basename(filePath),
    customMetadata = [],
    maxTokensPerChunk = 500,
    maxOverlapTokens = 50,
    mimeType,
  } = options;

  // MIME 타입 자동 지정 (비ASCII 파일명 등으로 인한 감지 실패 대비)
  let resolvedMimeType = mimeType;
  if (!resolvedMimeType) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      ".md": "text/markdown",
      ".markdown": "text/markdown",
      ".txt": "text/plain",
      ".text": "text/plain",
      ".pdf": "application/pdf",
      ".csv": "text/csv",
      ".json": "application/json",
      ".html": "text/html",
      ".htm": "text/html",
    };

    resolvedMimeType = mimeMap[ext] || "application/octet-stream";
  }

  let advancedUploadOp = await ai.fileSearchStores.uploadToFileSearchStore({
    file: filePath,
    fileSearchStoreName: fileStore.name,
    config: {
      displayName,
      customMetadata,
      mimeType: resolvedMimeType,
      chunkingConfig: {
        whiteSpaceConfig: {
          maxTokensPerChunk,
          maxOverlapTokens,
        },
      },
    },
  });

  // 파일 처리 완료까지 폴링 (1초마다 상태 확인)
  while (!advancedUploadOp.done) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    advancedUploadOp = await ai.operations.get({ operation: advancedUploadOp });
  }

  console.log(`✅ 고급 파일 처리 완료: ${displayName}`);
  return advancedUploadOp;
}

// ============================================
// RAG (Retrieval-Augmented Generation) 쿼리 함수
// ============================================

/**
 * File Search를 사용한 생성 쿼리 (RAG)
 *
 * 업로드된 문서들을 검색하여 관련 정보를 찾고, 그 정보를 바탕으로 AI가 답변을 생성합니다.
 * RAG(Retrieval-Augmented Generation) 패턴을 구현한 함수입니다.
 *
 * @param {Object} fileStore - 검색할 스토어 객체
 * @param {string} query - 사용자의 질문 또는 쿼리
 * @param {string|null} [metadataFilter=null] - 메타데이터 필터 (선택사항, 예: 'doc_type="manual"')
 * @returns {Promise<Object>} AI 생성 응답 객체 (text, candidates, groundingMetadata 등)
 */
async function generateContentWithFileSearch(
  fileStore,
  query,
  metadataFilter = null
) {
  console.log(`\n💬 쿼리로 콘텐츠 생성 중: "${query}"`);

  const toolsConfig = {
    fileSearch: {
      fileSearchStoreNames: [fileStore.name],
    },
  };

  if (metadataFilter) {
    toolsConfig.fileSearch.metadataFilter = metadataFilter;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      tools: [toolsConfig],
      systemInstruction:
        "답변은 다음 형식으로 작성해주세요: 답변을 md형식으로 작성해주세요. 답변은 짧고 요점을 명확하게 작성해주세요. 순서대로 정리되게 작성해주세요.",
    },
  });

  console.log(`\n📝 모델 응답:\n${response.text}\n`);

  // Grounding 메타데이터 확인 (인용 정보)
  // groundingMetadata에는 AI가 참조한 문서의 출처 정보가 포함됩니다
  if (response.candidates?.[0]?.groundingMetadata) {
    console.log(`📚 groundingMetadata에서 인용 정보를 확인할 수 있습니다`);
  }

  return response;
}

// ============================================
// 문서 관리 함수
// ============================================

/**
 * Store 내 특정 문서 찾기
 *
 * 스토어 내에서 표시 이름을 기준으로 특정 문서를 검색합니다.
 * 여러 페이지에 걸쳐 검색하며, 찾지 못하면 에러를 발생시킵니다.
 *
 * @param {Object} fileStore - 검색할 스토어 객체
 * @param {string} displayName - 찾을 문서의 표시 이름
 * @returns {Promise<Object>} 찾은 문서 정보
 * @throws {Error} 문서를 찾을 수 없을 경우
 */
async function findDocumentByDisplayName(fileStore, displayName) {
  console.log(`\n🔍 문서 검색 중: ${displayName}`);

  let targetDoc = null;
  let documentPager = await ai.fileSearchStores.documents.list({
    parent: fileStore.name,
  });

  searchDocsLoop: while (true) {
    for (const document of documentPager.page) {
      if (document.displayName === displayName) {
        targetDoc = document;
        break searchDocsLoop;
      }
    }
    if (!documentPager.hasNextPage()) break;
    documentPager = await documentPager.nextPage();
  }

  if (!targetDoc) {
    throw new Error(`'${displayName}' 문서를 찾을 수 없습니다.`);
  }

  console.log(`✅ 문서를 찾았습니다: ${targetDoc.name}`);
  return targetDoc;
}

/**
 * 문서 삭제
 *
 * File Search Store에서 특정 문서를 삭제합니다.
 * force 옵션을 사용하여 스토어에서 영구적으로 삭제합니다.
 *
 * @param {Object} document - 삭제할 문서 객체 (name, displayName 포함)
 * @returns {Promise<void>}
 */
async function deleteDocument(document) {
  console.log(`\n🗑️  문서 삭제 중: ${document.displayName}`);

  await ai.fileSearchStores.documents.delete({
    name: document.name,
    config: { force: true }, // Store에서 영구 삭제를 위해 필수
  });

  console.log(`✅ 문서가 성공적으로 삭제되었습니다`);
}

/**
 * 문서 업데이트
 *
 * 기존 문서를 새 버전으로 교체합니다.
 * 기존 문서를 삭제한 후 새 파일을 업로드하는 방식으로 동작합니다.
 *
 * @param {Object} fileStore - 문서가 속한 스토어 객체
 * @param {string} docDisplayName - 업데이트할 문서의 표시 이름
 * @param {string} localDocPath - 새 버전 파일의 로컬 경로
 * @returns {Promise<Object>} 업로드 완료된 파일의 operation 결과
 */
async function updateDocument(fileStore, docDisplayName, localDocPath) {
  console.log(`\n🔄 문서 업데이트 중: ${docDisplayName}`);

  // 1. 기존 문서 찾기
  let documentPager = await ai.fileSearchStores.documents.list({
    parent: fileStore.name,
  });
  let foundDoc = null;

  findLoop: while (true) {
    for (const doc of documentPager.page) {
      if (doc.displayName === docDisplayName) {
        foundDoc = doc;
        break findLoop;
      }
    }
    if (!documentPager.hasNextPage()) break;
    documentPager = await documentPager.nextPage();
  }

  // 2. 기존 문서가 있으면 삭제
  if (foundDoc) {
    await ai.fileSearchStores.documents.delete({
      name: foundDoc.name,
      config: { force: true },
    });
    console.log(`✅ 이전 버전이 삭제되었습니다`);
  }

  // 3. 새 버전 파일 업로드 및 인덱싱
  let updateOp = await ai.fileSearchStores.uploadToFileSearchStore({
    file: localDocPath,
    fileSearchStoreName: fileStore.name,
    config: { displayName: docDisplayName },
  });

  while (!updateOp.done) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateOp = await ai.operations.get({ operation: updateOp });
  }

  console.log(`✅ 새 버전이 업로드되고 인덱싱되었습니다`);
  return updateOp;
}

/**
 * File Search Store 삭제
 *
 * File Search Store와 그 안의 모든 문서를 삭제합니다.
 * force 옵션을 사용하여 영구적으로 삭제합니다.
 *
 * @param {Object} fileStore - 삭제할 스토어 객체
 * @returns {Promise<void>}
 */
async function deleteFileSearchStore(fileStore) {
  console.log(`\n🗑️  파일 검색 스토어 삭제 중: ${fileStore.displayName}`);

  await ai.fileSearchStores.delete({
    name: fileStore.name,
    config: { force: true },
  });

  console.log(`✅ 스토어가 성공적으로 삭제되었습니다`);
  // 캐시에서도 제거
  storeCache.delete(fileStore.displayName);
}

// ============================================
// 메인 실행 함수 (CLI 스크립트용)
// ============================================

/**
 * 메인 실행 함수
 *
 * index.js를 직접 실행할 때 호출되는 함수입니다.
 * File Search Store를 생성하거나 찾고, 문서를 업로드한 후 예제 쿼리를 실행합니다.
 *
 * 실행 순서:
 * 1. API 키 확인
 * 2. 스토어 생성 또는 찾기
 * 3. docs 디렉토리의 파일들 업로드
 * 4. 예제 쿼리 실행
 */
async function main() {
  try {
    // API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요."
      );
    }

    const fileStoreName = "my-example-store";
    const docsDir = path.join(__dirname, "docs");

    // Store 생성 또는 찾기
    let fileStore;
    try {
      fileStore = await findStoreByDisplayName(fileStoreName);
    } catch (error) {
      console.log("스토어를 찾을 수 없어 새로 생성합니다...");
      const createOp = await createFileSearchStore(fileStoreName);
      fileStore = await findStoreByDisplayName(fileStoreName);
    }

    // 파일 업로드
    await uploadMultipleFiles(fileStore, docsDir);

    // 예제 쿼리 실행
    await generateContentWithFileSearch(
      fileStore,
      "업로드된 문서들에 대해 요약해주세요."
    );

    // 메타데이터 필터 예제 (커스텀 메타데이터가 있는 경우)
    // await generateContentWithFileSearch(
    //   fileStore,
    //   "매뉴얼에 따르면 기기를 리셋하는 방법은?",
    //   'doc_type="manual"'
    // );

    console.log("\n✨ 모든 작업이 완료되었습니다!");

    // 개발 완료 후 Store 삭제하려면 아래 주석 해제
    // await deleteFileSearchStore(fileStore);
  } catch (error) {
    console.error("❌ 오류:", error.message);
    process.exit(1);
  }
}

// ============================================
// 모듈 실행 및 Export
// ============================================

/**
 * 스크립트가 직접 실행된 경우에만 main 함수 실행
 * 다른 모듈에서 import할 때는 실행되지 않습니다.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

/**
 * 함수들을 export하여 다른 모듈(server.js 등)에서 사용 가능하도록 합니다.
 */
export {
  createFileSearchStore,
  findStoreByDisplayName,
  uploadMultipleFiles,
  uploadWithCustomChunking,
  generateContentWithFileSearch,
  findDocumentByDisplayName,
  deleteDocument,
  updateDocument,
  deleteFileSearchStore,
};
