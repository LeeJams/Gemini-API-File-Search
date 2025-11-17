// ============================================
// 전역 설정
// ============================================

/**
 * API 기본 URL
 * 빈 문자열이면 현재 도메인을 사용합니다.
 */
const API_BASE_URL = "";

/**
 * 로컬스토리지 키 정의
 *
 * - STORES_CACHE: 스토어 목록 캐시 (displayName, name 등)
 */
const STORES_CACHE_KEY = "gemini_file_search_stores_cache";
const STORES_CACHE_TTL_MS = 5 * 60 * 1000; // 5분

/**
 * 현재 스토어 이름
 * workspace.html에서 URL 파라미터로 설정됩니다.
 */
function getStoreName() {
  return window.CURRENT_STORE || "sellpick";
}

const STORE_NAME = getStoreName();

// ============================================
// UI 유틸리티 함수
// ============================================

/**
 * 로딩 오버레이 표시
 * API 호출 중 사용자에게 로딩 상태를 보여줍니다.
 */
function showLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.remove("hidden");
  }
}

/**
 * 로딩 오버레이 숨김
 * API 호출 완료 후 로딩 상태를 숨깁니다.
 */
function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

// ============================================
// API 호출 함수
// ============================================

/**
 * API 호출 헬퍼 함수
 *
 * 공통 API 호출 로직을 처리하는 함수입니다.
 * 에러 처리와 JSON 파싱을 자동으로 수행합니다.
 *
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} options - fetch 옵션 (method, body, headers 등)
 * @returns {Promise<Object>} API 응답 데이터
 * @throws {Error} API 호출 실패 시
 */
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "요청 실패");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ============================================
// 파일 업로드 기능
// ============================================

/**
 * 파일 업로드
 *
 * 사용자가 선택한 파일들을 File Search Store에 업로드합니다.
 * 여러 파일을 동시에 업로드할 수 있으며, 업로드 완료 후 문서 목록을 자동으로 새로고침합니다.
 */
async function uploadFiles() {
  const fileInput = document.getElementById("file-input");

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("업로드할 파일을 선택하세요");
    return;
  }

  showLoading();
  try {
    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append("files", fileInput.files[i]);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/stores/${encodeURIComponent(STORE_NAME)}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "업로드 실패");
    }

    const statusElement = document.getElementById("upload-status");
    if (statusElement) {
      const successCount = Array.isArray(data.data)
        ? data.data.filter((item) => item.status === "success").length
        : 0;

      statusElement.innerHTML = `
        <span class="status-icon">✓</span>
        <span>파일 업로드 완료: ${successCount}개 파일</span>
      `;
      statusElement.className = "status-message success";
    }

    // 입력 및 선택 파일 미리보기 초기화
    fileInput.value = "";
    updateSelectedFilesPreview();

    // 문서 목록 새로고침 및 모달 닫기
    await loadDocuments();
    closeUploadModal();
  } catch (error) {
    const statusElement = document.getElementById("upload-status");
    statusElement.innerHTML = `
      <span class="status-icon">✕</span>
      <span>오류: ${error.message}</span>
    `;
    statusElement.className = "status-message error";
  } finally {
    hideLoading();
  }
}

// ============================================
// RAG 쿼리 실행 기능
// ============================================

/**
 * 쿼리 실행 (RAG)
 *
 * 사용자가 입력한 질문을 바탕으로 업로드된 문서를 검색하고 AI가 답변을 생성합니다.
 * 메타데이터 필터를 사용하여 특정 문서만 검색할 수 있습니다.
 */
async function executeQuery() {
  const queryInput = document.getElementById("query-input");
  const query = queryInput.value.trim();
  const metadataFilterInput = document.getElementById("metadata-filter");
  const metadataFilter = metadataFilterInput
    ? metadataFilterInput.value.trim()
    : "";

  if (!query) {
    alert("질문을 입력하세요");
    return;
  }

  // Check if chat interface exists
  const isChatInterface = document.getElementById("chat-history") !== null;

  if (isChatInterface) {
    // Chat interface: add user message first
    addMessageToUI("user", query);

    // Clear input
    queryInput.value = "";
    queryInput.style.height = "auto";
  }

  showLoading();
  try {
    const data = await apiCall(
      `/api/stores/${encodeURIComponent(getStoreName())}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          query,
          metadataFilter: metadataFilter || undefined,
        }),
      }
    );

    if (isChatInterface) {
      // Chat interface: add AI response
      const metadata = data.data.groundingMetadata || null;

      // Save grounding metadata globally
      if (metadata) {
        window.LAST_GROUNDING_METADATA = metadata;
      }

      addMessageToUI("ai", data.data.text, metadata);
    } else {
      // Old interface: display in result container
      const resultContainer = document.getElementById("query-result");

      // Markdown 렌더링
      const renderedText =
        typeof marked !== "undefined"
          ? marked.parse(data.data.text)
          : escapeHtml(data.data.text).replace(/\n/g, "<br>");

      // Grounding Metadata 처리
      let groundingHTML = "";
      if (data.data.groundingMetadata) {
        const metadata = data.data.groundingMetadata;

        // 최근 인용 정보를 전역에 저장하여 모달에서 사용
        window.LAST_GROUNDING_METADATA = metadata;

        // 검색된 문서 정보 추출
        if (metadata.retrievalQueries && metadata.retrievalQueries.length > 0) {
          groundingHTML += `
            <div class="grounding-section">
              <div class="grounding-title">
                <svg class="grounding-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                검색 쿼리
              </div>
              ${metadata.retrievalQueries
                .map(
                  (query) =>
                    `<div class="grounding-item">${escapeHtml(query)}</div>`
                )
                .join("")}
            </div>
          `;
        }

        // 인용된 소스 정보 (참조 문서)
        if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
          groundingHTML += `
            <div class="grounding-section">
              <div class="grounding-title">
                <svg class="grounding-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                참조 문서 (${metadata.groundingChunks.length}개)
              </div>
              <div class="grounding-chunks">
                ${metadata.groundingChunks
                  .map(
                    (chunk, idx) => `
                  <div class="grounding-chunk">
                    <div class="chunk-header">
                      <span class="chunk-number">#${idx + 1}</span>
                      ${(() => {
                        const title =
                          (chunk.retrievedContext &&
                            chunk.retrievedContext.title) ||
                          (chunk.web && (chunk.web.title || chunk.web.uri));
                        if (!title) return "";
                        return `
                          <button type="button" class="chunk-link chunk-link-button" onclick="openGroundingContext(${idx})">
                            ${escapeHtml(title)}
                          </button>
                        `;
                      })()}
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
        }
      }

      resultContainer.innerHTML = `
        <div class="bento-card result-card">
          <div class="result-header">
            <svg class="result-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="result-label">AI Response</span>
          </div>
          <div class="result-text markdown-content">${renderedText}</div>
          ${
            groundingHTML
              ? `
            <div class="result-meta">
              <svg class="result-meta-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span>인용 정보</span>
            </div>
            ${groundingHTML}
          `
              : ""
          }
        </div>
      `;
    }
  } catch (error) {
    if (isChatInterface) {
      addMessageToUI("ai", `오류: ${error.message}`);
    } else {
      const resultContainer = document.getElementById("query-result");
      if (resultContainer) {
        resultContainer.innerHTML = `<div class="status-message error">오류: ${error.message}</div>`;
      }
    }
  } finally {
    hideLoading();
  }
}

// ============================================
// 문서 관리 기능
// ============================================

/**
 * Knowledge Base 정보 업데이트
 *
 * 문서 개수와 최종 업데이트 날짜를 표시합니다.
 */
function updateKnowledgeBaseInfo(documents) {
  const docCountEl = document.getElementById("kb-doc-count");
  const updatedDateEl = document.getElementById("kb-updated-date");

  if (docCountEl) {
    docCountEl.textContent = documents.length;
  }

  if (updatedDateEl && documents.length > 0) {
    // 가장 최근 업데이트된 문서 찾기
    const latestDoc = documents.reduce((latest, doc) => {
      const latestTime = new Date(latest.updateTime || latest.createTime);
      const currentTime = new Date(doc.updateTime || doc.createTime);
      return currentTime > latestTime ? doc : latest;
    });

    const date = new Date(latestDoc.updateTime || latestDoc.createTime);
    updatedDateEl.textContent = date.toISOString().split("T")[0];
  }
}

/**
 * 문서 목록 로드
 *
 * 스토어에 업로드된 모든 문서 목록을 조회하여 화면에 표시합니다.
 * 문서 삭제 버튼도 함께 표시됩니다.
 */
async function loadDocuments() {
  const container = document.getElementById("documents-list");

  // documents-list가 없으면 Knowledge Base 정보만 업데이트
  const isKnowledgeBaseView = !container;

  showLoading();
  try {
    console.log("문서 목록 로드 시작:", STORE_NAME);
    const data = await apiCall(
      `/api/stores/${encodeURIComponent(STORE_NAME)}/documents`
    );
    console.log("API 응답:", data);

    const documents = data.data || [];

    // Knowledge Base 정보 업데이트
    updateKnowledgeBaseInfo(documents);

    // documents-list 컨테이너가 없으면 여기서 종료
    if (isKnowledgeBaseView) {
      return;
    }

    if (documents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">등록된 문서가 없습니다</div>
          <div class="empty-description">파일을 업로드하여 시작하세요</div>
        </div>
      `;
      return;
    }

    container.innerHTML = documents
      .map(
        (doc) => `
            <div class="document-list-item">
                <svg class="document-list-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <div class="document-list-info">
                    <div class="document-list-name">${escapeHtml(
                      doc.displayName
                    )}</div>
                    <div class="document-list-meta">
                        Created: ${formatDate(doc.createTime)}
                    </div>
                </div>
                <div class="document-list-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteDocument('${escapeHtml(
                      getStoreName()
                    )}', '${escapeHtml(doc.displayName)}')">
                        <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("문서 목록 로드 오류:", error);
    const errorMessage = error.message || "알 수 없는 오류가 발생했습니다";
    container.innerHTML = `<div class="status-message error">오류: ${errorMessage}</div>`;
  } finally {
    hideLoading();
  }
}

/**
 * 문서 삭제
 *
 * 사용자 확인 후 특정 문서를 스토어에서 삭제합니다.
 * 삭제 완료 후 문서 목록을 자동으로 새로고침합니다.
 *
 * @param {string} storeName - 문서가 속한 스토어 이름
 * @param {string} docDisplayName - 삭제할 문서의 표시 이름
 */
async function deleteDocument(storeName, docDisplayName) {
  if (!confirm(`정말로 "${docDisplayName}" 문서를 삭제하시겠습니까?`)) {
    return;
  }

  showLoading();
  try {
    await apiCall(
      `/api/stores/${encodeURIComponent(
        storeName
      )}/documents/${encodeURIComponent(docDisplayName)}`,
      {
        method: "DELETE",
      }
    );

    loadDocuments();
    alert("문서가 삭제되었습니다");
  } catch (error) {
    alert(`삭제 실패: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 상태 메시지 표시
 *
 * 성공/에러 등의 상태 메시지를 화면에 표시합니다.
 * 5초 후 자동으로 메시지 스타일이 초기화됩니다.
 *
 * @param {string} elementId - 메시지를 표시할 요소의 ID
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 타입 ('success', 'error' 등)
 */
function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `status-message ${type}`;
  setTimeout(() => {
    element.className = "status-message";
  }, 5000);
}

/**
 * HTML 이스케이프
 *
 * 사용자 입력을 안전하게 HTML에 표시하기 위해 특수 문자를 이스케이프합니다.
 * XSS 공격을 방지하는 데 사용됩니다.
 *
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 HTML 문자열
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 날짜 포맷팅
 *
 * ISO 날짜 문자열을 한국어 형식으로 포맷팅합니다.
 *
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열 또는 'N/A'
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR");
  } catch {
    return dateString;
  }
}

// ============================================
// Original Files (docs) 기능
// ============================================

/**
 * Open Docs Modal
 *
 * docs 폴더의 파일 목록을 모달로 표시합니다.
 */
async function openDocsModal() {
  const modal = document.getElementById("docs-modal");
  const fileList = document.getElementById("docs-file-list");

  modal.classList.remove("hidden");
  showLoading();

  try {
    const response = await fetch("/api/docs/files");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "파일 목록 조회 실패");
    }

    const files = data.data || [];

    if (files.length === 0) {
      fileList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">파일이 없습니다</div>
        </div>
      `;
      return;
    }

    fileList.innerHTML = files
      .map(
        (file) => `
        <div class="docs-file-card" onclick="openFileContent('${escapeHtml(
          file.name
        )}')">
          <svg class="docs-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
          <div class="docs-file-name">${escapeHtml(file.name)}</div>
          <div class="docs-file-meta">${formatFileSize(file.size)}</div>
        </div>
      `
      )
      .join("");
  } catch (error) {
    fileList.innerHTML = `<div class="status-message error">오류: ${error.message}</div>`;
  } finally {
    hideLoading();
  }
}

/**
 * Close Docs Modal
 */
function closeDocsModal() {
  const modal = document.getElementById("docs-modal");
  modal.classList.add("hidden");
}

/**
 * Open File Content Modal
 *
 * 선택한 파일의 내용을 마크다운으로 렌더링하여 표시합니다.
 */
async function openFileContent(filename) {
  const modal = document.getElementById("file-content-modal");
  const title = document.getElementById("file-content-title");
  const content = document.getElementById("file-content");

  modal.classList.remove("hidden");
  title.textContent = filename;
  content.innerHTML =
    '<div class="text-sm" style="color: var(--color-gray-500);">로딩 중...</div>';

  try {
    const response = await fetch(
      `/api/docs/file/${encodeURIComponent(filename)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "파일 읽기 실패");
    }

    // 마크다운 렌더링
    const renderedContent =
      typeof marked !== "undefined"
        ? marked.parse(data.data.content)
        : escapeHtml(data.data.content).replace(/\n/g, "<br>");

    content.innerHTML = renderedContent;
  } catch (error) {
    content.innerHTML = `<div class="status-message error">오류: ${error.message}</div>`;
  }
}

/**
 * Grounding Chunk 내용 모달로 열기
 *
 * 참조 문서 영역에서 제목을 클릭했을 때, 해당 인용 컨텍스트의 텍스트를
 * 모달로 보여줍니다.
 *
 * @param {number} index - groundingChunks 배열 인덱스
 */
function openGroundingContext(index) {
  const metadata = window.LAST_GROUNDING_METADATA;
  if (
    !metadata ||
    !Array.isArray(metadata.groundingChunks) ||
    !metadata.groundingChunks[index]
  ) {
    return;
  }

  const chunk = metadata.groundingChunks[index];
  const title =
    (chunk.retrievedContext && chunk.retrievedContext.title) ||
    `참조 문서 #${index + 1}`;
  const text = (chunk.retrievedContext && chunk.retrievedContext.text) || "";

  const modal = document.getElementById("file-content-modal");
  const titleEl = document.getElementById("file-content-title");
  const content = document.getElementById("file-content");

  if (!modal || !titleEl || !content) return;

  modal.classList.remove("hidden");
  titleEl.textContent = title;

  const rendered =
    typeof marked !== "undefined"
      ? marked.parse(text)
      : escapeHtml(text).replace(/\n/g, "<br>");

  content.innerHTML = rendered;
}

/**
 * Close File Content Modal
 */
function closeFileContentModal() {
  const modal = document.getElementById("file-content-modal");
  modal.classList.add("hidden");
}

/**
 * Upload Modal 열기
 *
 * 문서 페이지에서 업로드 버튼 클릭 시 전체 페이지 이동 대신
 * 모달을 통해 파일 업로드를 처리합니다.
 */
function openUploadModal() {
  const modal = document.getElementById("upload-modal");
  if (!modal) return;

  modal.classList.remove("hidden");

  const fileInput = document.getElementById("file-input");
  const statusElement = document.getElementById("upload-status");
  const selectedFilesEl = document.getElementById("selected-files");

  if (fileInput) {
    fileInput.value = "";
  }

  if (statusElement) {
    statusElement.textContent = "";
    statusElement.className = "status-message";
  }

  if (selectedFilesEl) {
    selectedFilesEl.innerHTML = "";
    selectedFilesEl.style.display = "none";
  }
}

/**
 * Upload Modal 닫기
 */
function closeUploadModal() {
  const modal = document.getElementById("upload-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

/**
 * 선택된 파일 미리보기 업데이트
 *
 * 업로드 모달에서 사용자가 선택한 파일 목록을 표시합니다.
 */
function updateSelectedFilesPreview() {
  const fileInput = document.getElementById("file-input");
  const container = document.getElementById("selected-files");

  if (!fileInput || !container) return;

  const files = fileInput.files;

  if (!files || files.length === 0) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }

  const items = Array.from(files)
    .map((file) => `<li>${escapeHtml(file.name)}</li>`)
    .join("");

  container.innerHTML = `
    <div class="selected-files-header">
      <span class="selected-files-title">선택된 파일 (${files.length}개)</span>
    </div>
    <ul class="selected-files-list">
      ${items}
    </ul>
  `;

  container.style.display = "block";
}

// 파일 입력 변경 시 선택된 파일 미리보기 업데이트
window.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  if (fileInput) {
    fileInput.addEventListener("change", updateSelectedFilesPreview);
  }
});

/**
 * Format File Size
 *
 * 파일 크기를 읽기 좋은 형식으로 변환합니다.
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ============================================
// Store 관리 기능
// ============================================

/**
 * Load Stores
 *
 * 모든 스토어 목록을 조회하여 카드로 표시합니다.
 */
async function loadStores() {
  const container = document.getElementById("store-grid");

  if (!container) return;

  showLoading();

  try {
    let stores = [];

    // 1. 로컬스토리지 캐시 우선 사용
    try {
      const raw = localStorage.getItem(STORES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.data) &&
          typeof parsed.timestamp === "number" &&
          Date.now() - parsed.timestamp < STORES_CACHE_TTL_MS
        ) {
          stores = parsed.data;
          console.log("스토어 목록 로컬 캐시 사용");
        }
      }
    } catch (e) {
      // 캐시 파싱 실패 시 무시하고 서버에서 다시 조회
      console.warn("스토어 캐시 파싱 실패, 서버 조회로 대체:", e);
    }

    // 2. 캐시가 없거나 만료된 경우 서버에서 조회
    if (stores.length === 0) {
      const response = await fetch("/api/stores");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "스토어 목록 조회 실패");
      }

      stores = data.data || [];

      // 서버에서 조회한 결과를 로컬스토리지에 캐싱
      try {
        localStorage.setItem(
          STORES_CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: stores,
          })
        );
      } catch (e) {
        // 로컬스토리지 저장 실패는 치명적이지 않으므로 무시
        console.warn("스토어 캐시 저장 실패:", e);
      }
    }

    container.innerHTML =
      stores
        .map(
          (store) => `
        <div class="store-card" onclick="openStore('${escapeHtml(
          store.displayName
        )}')">
          <div class="store-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div class="store-card-name">${escapeHtml(store.displayName)}</div>
          <div class="store-card-meta">Store</div>
        </div>
      `
        )
        .join("") +
      `
      <div class="store-card store-card-add" onclick="openAddStoreModal()">
        <div class="store-card-add-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div class="store-card-add-text">Add Store</div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1;">
        <div class="status-message error">오류: ${error.message}</div>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

/**
 * Open Store
 *
 * 선택한 스토어의 workspace로 이동합니다.
 */
function openStore(storeName) {
  window.location.href = `/workspace.html?store=${encodeURIComponent(
    storeName
  )}`;
}

/**
 * Open Add Store Modal
 */
function openAddStoreModal() {
  const modal = document.getElementById("add-store-modal");
  const input = document.getElementById("new-store-name");

  modal.classList.remove("hidden");
  if (input) {
    input.value = "";
    input.focus();
  }
}

/**
 * Close Add Store Modal
 */
function closeAddStoreModal() {
  const modal = document.getElementById("add-store-modal");
  modal.classList.add("hidden");
}

/**
 * Create Store
 *
 * 새로운 스토어를 생성합니다.
 */
async function createStore() {
  const input = document.getElementById("new-store-name");
  const storeName = input.value.trim();

  if (!storeName) {
    alert("스토어 이름을 입력하세요");
    return;
  }

  // Validate store name
  if (!/^[a-zA-Z0-9_-]+$/.test(storeName)) {
    alert(
      "스토어 이름은 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다"
    );
    return;
  }

  showLoading();

  try {
    const response = await fetch("/api/stores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName: storeName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "스토어 생성 실패");
    }

    closeAddStoreModal();
    loadStores();
  } catch (error) {
    alert(`오류: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// CHAT INTERFACE FUNCTIONS
// ============================================

/**
 * Chat History Storage Key
 */
const CHAT_HISTORY_KEY = "gemini_chat_history";

/**
 * Get Chat History from LocalStorage
 */
function getChatHistory() {
  try {
    const storeName = getStoreName();
    const key = `${CHAT_HISTORY_KEY}_${storeName}`;
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error("채팅 기록 로드 실패:", e);
    return [];
  }
}

/**
 * Save Chat History to LocalStorage
 */
function saveChatHistory(history) {
  try {
    const storeName = getStoreName();
    const key = `${CHAT_HISTORY_KEY}_${storeName}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error("채팅 기록 저장 실패:", e);
  }
}

/**
 * Load Chat History from Storage and Display
 */
function loadChatHistory() {
  const history = getChatHistory();
  const chatHistory = document.getElementById("chat-history");

  if (!chatHistory) return;

  // Clear existing messages except welcome
  const welcome = chatHistory.querySelector(".chat-welcome");
  chatHistory.innerHTML = "";

  if (history.length === 0 && welcome) {
    chatHistory.appendChild(welcome);
    return;
  }

  // Display all messages from history
  history.forEach((message) => {
    addMessageToUI(message.type, message.text, message.grounding, false);
  });

  // Scroll to bottom
  scrollToBottom();
}

/**
 * Add Message to Chat UI
 */
function addMessageToUI(type, text, grounding = null, save = true) {
  const chatHistory = document.getElementById("chat-history");
  if (!chatHistory) return;

  // Hide welcome message on first message
  const welcome = chatHistory.querySelector(".chat-welcome");
  if (welcome) {
    welcome.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message chat-message-${type}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-message-bubble";

  const textDiv = document.createElement("div");
  textDiv.className = "chat-message-text";

  if (type === "ai") {
    // Render markdown for AI responses
    const renderedText =
      typeof marked !== "undefined"
        ? marked.parse(text)
        : escapeHtml(text).replace(/\n/g, "<br>");
    textDiv.innerHTML = renderedText;
    textDiv.classList.add("markdown-content");

    // Add grounding info if available
    if (grounding && grounding.groundingChunks) {
      const groundingDiv = document.createElement("div");
      groundingDiv.className = "chat-grounding";

      const groundingTitle = document.createElement("div");
      groundingTitle.className = "chat-grounding-title";
      groundingTitle.innerHTML = `
        <svg class="chat-grounding-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        참조 문서 (${grounding.groundingChunks.length}개)
      `;

      const groundingList = document.createElement("div");
      groundingList.className = "chat-grounding-list";

      grounding.groundingChunks.forEach((chunk, idx) => {
        const chip = document.createElement("div");
        chip.className = "chat-grounding-chip";
        chip.onclick = () => openGroundingContext(idx);

        const title =
          (chunk.retrievedContext && chunk.retrievedContext.title) ||
          (chunk.web && (chunk.web.title || chunk.web.uri)) ||
          `문서 #${idx + 1}`;

        chip.innerHTML = `
          <span class="chat-grounding-number">${idx + 1}</span>
          <span>${escapeHtml(title)}</span>
        `;

        groundingList.appendChild(chip);
      });

      groundingDiv.appendChild(groundingTitle);
      groundingDiv.appendChild(groundingList);
      bubble.appendChild(textDiv);
      bubble.appendChild(groundingDiv);
    } else {
      bubble.appendChild(textDiv);
    }
  } else {
    textDiv.textContent = text;
    bubble.appendChild(textDiv);
  }

  const time = document.createElement("div");
  time.className = "chat-message-time";
  time.textContent = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.appendChild(bubble);
  messageDiv.appendChild(time);
  chatHistory.appendChild(messageDiv);

  // Save to history
  if (save) {
    const history = getChatHistory();
    history.push({ type, text, grounding, timestamp: Date.now() });
    saveChatHistory(history);
  }

  scrollToBottom();
}

/**
 * Scroll Chat to Bottom
 */
function scrollToBottom() {
  const container = document.querySelector(".chat-history-container");
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }
}

/**
 * Clear Chat History
 */
function clearChatHistory() {
  if (!confirm("대화 기록을 모두 삭제하시겠습니까?")) {
    return;
  }

  const storeName = getStoreName();
  const key = `${CHAT_HISTORY_KEY}_${storeName}`;
  localStorage.removeItem(key);

  // Reset UI
  const chatHistory = document.getElementById("chat-history");
  if (chatHistory) {
    chatHistory.innerHTML = `
      <div class="chat-welcome">
        <h2 class="chat-welcome-title">RAG Query Chat</h2>
        <p class="chat-welcome-description">업로드된 문서를 기반으로 질문하고 답변을 받아보세요</p>
      </div>
    `;
  }

  // Clear grounding metadata
  window.LAST_GROUNDING_METADATA = null;
}

/**
 * Toggle Metadata Panel
 */
function toggleMetadataPanel() {
  const panel = document.getElementById("metadata-panel");
  if (panel) {
    panel.classList.toggle("hidden");
  }
}

/**
 * Auto-resize Textarea
 */
function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
}

// ============================================
// CHAT EVENT LISTENERS
// ============================================

window.addEventListener("DOMContentLoaded", () => {
  // Load chat history on page load (workspace page only)
  if (document.getElementById("chat-history")) {
    loadChatHistory();
  }

  // Auto-resize textarea
  const queryInput = document.getElementById("query-input");
  if (queryInput && queryInput.classList.contains("chat-textarea")) {
    queryInput.addEventListener("input", function () {
      autoResizeTextarea(this);
    });

    // Handle Enter key (send) and Shift+Enter (newline)
    queryInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        executeQuery();
      }
    });
  }
});
