import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config();

// GoogleGenAI 클라이언트 초기화
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * 1. File Search Store 생성
 */
async function createFileSearchStore(displayName) {
  console.log(`\n📦 파일 검색 스토어 생성 중: ${displayName}`);

  const createStoreOp = await ai.fileSearchStores.create({
    config: { displayName },
  });

  console.log(`✅ 스토어가 생성되었습니다: ${createStoreOp.name}`);
  return createStoreOp;
}

/**
 * 2. Display Name으로 Store 찾기
 */
async function findStoreByDisplayName(displayName) {
  console.log(`\n🔍 스토어 검색 중: ${displayName}`);

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
  return fileStore;
}

/**
 * 3. 여러 파일 동시 업로드
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
 * 4. 커스텀 청킹 전략으로 업로드
 */
async function uploadWithCustomChunking(fileStore, filePath, options = {}) {
  console.log(`\n📄 커스텀 청킹으로 업로드 중: ${filePath}`);

  const {
    displayName = path.basename(filePath),
    customMetadata = [],
    maxTokensPerChunk = 500,
    maxOverlapTokens = 50,
  } = options;

  let advancedUploadOp = await ai.fileSearchStores.uploadToFileSearchStore({
    file: filePath,
    fileSearchStoreName: fileStore.name,
    config: {
      displayName,
      customMetadata,
      chunkingConfig: {
        whiteSpaceConfig: {
          maxTokensPerChunk,
          maxOverlapTokens,
        },
      },
    },
  });

  // 파일 처리 완료까지 대기
  while (!advancedUploadOp.done) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    advancedUploadOp = await ai.operations.get({ operation: advancedUploadOp });
  }

  console.log(`✅ 고급 파일 처리 완료: ${displayName}`);
  return advancedUploadOp;
}

/**
 * 5. File Search를 사용한 생성 쿼리 (RAG)
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
    },
  });

  console.log(`\n📝 모델 응답:\n${response.text}\n`);

  // Grounding 메타데이터 확인 (인용 정보)
  if (response.candidates?.[0]?.groundingMetadata) {
    console.log(`📚 groundingMetadata에서 인용 정보를 확인할 수 있습니다`);
  }

  return response;
}

/**
 * 6. Store 내 특정 문서 찾기
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
 * 7. 문서 삭제
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
 * 8. 문서 업데이트
 */
async function updateDocument(fileStore, docDisplayName, localDocPath) {
  console.log(`\n🔄 문서 업데이트 중: ${docDisplayName}`);

  // 1. 기존 문서 ID 찾기
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

  // 2. 찾은 경우 삭제
  if (foundDoc) {
    await ai.fileSearchStores.documents.delete({
      name: foundDoc.name,
      config: { force: true },
    });
    console.log(`✅ 이전 버전이 삭제되었습니다`);
  }

  // 3. 새 버전 업로드
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
 * 9. File Search Store 삭제 (정리)
 */
async function deleteFileSearchStore(fileStore) {
  console.log(`\n🗑️  파일 검색 스토어 삭제 중: ${fileStore.displayName}`);

  await ai.fileSearchStores.delete({
    name: fileStore.name,
    config: { force: true },
  });

  console.log(`✅ 스토어가 성공적으로 삭제되었습니다`);
}

/**
 * 메인 실행 함수
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

// 스크립트가 직접 실행된 경우에만 main 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// 함수들을 export하여 다른 모듈에서 사용 가능하도록
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
