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

    // Gemini 모델 과부하(503)인 경우, 보다 친절한 메시지와 함께 그대로 503으로 전달
    if (error.status === 503 || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error:
          "현재 Gemini 모델이 과부하 상태입니다. 잠시 후 다시 시도해주세요. (503 UNAVAILABLE)",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "쿼리 실행 중 알 수 없는 오류가 발생했습니다",
    });
  }
});

export default router;

