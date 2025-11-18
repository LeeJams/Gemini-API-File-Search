import express from "express";
import { findStoreByDisplayName, generateContentWithFileSearch } from "../index.js";

/**
 * 쿼리 실행 라우트
 * 
 * RAG(Retrieval-Augmented Generation)를 사용하여 문서를 검색하고 AI가 답변을 생성하는 라우트입니다.
 */

const router = express.Router();

/**
 * 쿼리 실행 (RAG)
 * POST /api/stores/:displayName/query
 * 
 * RAG(Retrieval-Augmented Generation)를 사용하여 문서를 검색하고 AI가 답변을 생성합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 쿼리를 실행할 스토어의 표시 이름
 * 
 * Request Body:
 *   - query (string, required): 사용자의 질문 또는 쿼리
 *   - metadataFilter (string, optional): 메타데이터 필터 (예: 'doc_type="manual"')
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - data (object): 응답 데이터
 *     - text (string): AI가 생성한 답변 텍스트
 *     - groundingMetadata (object|null): 인용 정보 (있는 경우)
 */
router.post("/:displayName/query", async (req, res) => {
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

    // API 에러 코드별 처리
    const status = error.status || error.statusCode || 500;
    let errorMessage = error.message || "쿼리 실행 중 알 수 없는 오류가 발생했습니다";
    let statusCode = 500;

    switch (status) {
      case 400:
        // Bad Request - 잘못된 요청
        statusCode = 400;
        errorMessage = `잘못된 요청입니다: ${error.message}`;
        break;

      case 403:
        // Forbidden - API 키 권한 문제
        statusCode = 403;
        errorMessage = "API 키 권한이 없거나 File Search가 활성화되지 않았습니다.";
        break;

      case 404:
        // Not Found - 스토어나 모델을 찾을 수 없음
        statusCode = 404;
        errorMessage = `리소스를 찾을 수 없습니다: ${error.message}`;
        break;

      case 429:
        // Rate Limit - API 호출 한도 초과
        statusCode = 429;
        errorMessage = "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        break;

      case 500:
        // Internal Server Error - 서버 내부 오류
        statusCode = 500;
        errorMessage = `서버 오류가 발생했습니다: ${error.message}`;
        break;

      case 503:
        // Service Unavailable - 모델 과부하
        statusCode = 503;
        errorMessage = "현재 Gemini 모델이 과부하 상태입니다. 잠시 후 다시 시도해주세요.";
        break;

      default:
        statusCode = 500;
        errorMessage = error.message || "알 수 없는 오류가 발생했습니다";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: status,
    });
  }
});

export default router;

