// ============================================
// 전역 설정
// ============================================

/**
 * API 기본 URL
 * 빈 문자열이면 현재 도메인을 사용합니다.
 */
const API_BASE_URL = "";

/**
 * 고정 스토어 이름
 * 모든 API 호출에서 사용할 File Search Store의 이름입니다.
 */
const STORE_NAME = "sellpick";

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

    showStatus(
      "upload-status",
      `파일 업로드 완료: ${data.data.length}개 파일`,
      "success"
    );
    fileInput.value = "";

    // 문서 목록 페이지가 활성화되어 있으면 자동 새로고침
    if (
      document.getElementById("documents-tab")?.classList.contains("active")
    ) {
      loadDocuments();
    }
  } catch (error) {
    showStatus("upload-status", `오류: ${error.message}`, "error");
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
  const query = document.getElementById("query-input").value.trim();
  const metadataFilter = document
    .getElementById("metadata-filter")
    .value.trim();

  if (!query) {
    alert("쿼리를 입력하세요");
    return;
  }

  showLoading();
  try {
    const data = await apiCall(
      `/api/stores/${encodeURIComponent(STORE_NAME)}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          query,
          metadataFilter: metadataFilter || undefined,
        }),
      }
    );

    const resultContainer = document.getElementById("query-result");
    resultContainer.innerHTML = `
            <div class="result-text">${escapeHtml(data.data.text)}</div>
            ${
              data.data.groundingMetadata
                ? `<div class="result-meta">인용 정보가 포함되어 있습니다</div>`
                : ""
            }
        `;
  } catch (error) {
    document.getElementById(
      "query-result"
    ).innerHTML = `<div class="status-message error">오류: ${error.message}</div>`;
  } finally {
    hideLoading();
  }
}

// ============================================
// 문서 관리 기능
// ============================================

/**
 * 문서 목록 로드
 *
 * 스토어에 업로드된 모든 문서 목록을 조회하여 화면에 표시합니다.
 * 문서 삭제 버튼도 함께 표시됩니다.
 */
async function loadDocuments() {
  const container = document.getElementById("documents-list");

  if (!container) {
    console.error("documents-list 요소를 찾을 수 없습니다");
    return;
  }

  showLoading();
  try {
    console.log("문서 목록 로드 시작:", STORE_NAME);
    const data = await apiCall(
      `/api/stores/${encodeURIComponent(STORE_NAME)}/documents`
    );
    console.log("API 응답:", data);

    const documents = data.data || [];

    if (documents.length === 0) {
      container.innerHTML =
        '<div class="empty-state">등록된 문서가 없습니다</div>';
      return;
    }

    container.innerHTML = documents
      .map(
        (doc) => `
            <div class="document-item">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(doc.displayName)}</div>
                    <div class="item-meta">
                        생성: ${formatDate(doc.createTime)} | 
                        수정: ${formatDate(doc.updateTime)}
                    </div>
                </div>
                <button class="btn btn-danger" onclick="deleteDocument('${escapeHtml(
                  STORE_NAME
                )}', '${escapeHtml(doc.displayName)}')">
                    삭제
                </button>
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
