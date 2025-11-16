import express from "express";
import { GoogleGenAI } from "@google/genai";
import {
  createFileSearchStore,
  findStoreByDisplayName,
  deleteFileSearchStore,
} from "../index.js";

/**
 * 스토어 관련 라우트
 * 
 * File Search Store의 생성, 조회, 삭제를 처리하는 라우트입니다.
 */

const router = express.Router();

// GoogleGenAI 클라이언트 초기화 (스토어 목록 조회에 필요)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * 스토어 생성
 * POST /api/stores
 * 
 * 새로운 File Search Store를 생성합니다.
 * 
 * Request Body:
 *   - displayName (string, required): 스토어의 표시 이름
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - message (string): 응답 메시지
 *   - data (object): 생성된 스토어 정보
 */
router.post("/", async (req, res) => {
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
 * 스토어 목록 조회
 * GET /api/stores
 * 
 * 생성된 모든 File Search Store 목록을 조회합니다.
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - data (array): 스토어 목록 배열
 *   - count (number): 스토어 개수
 */
router.get("/", async (req, res) => {
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
 * 특정 스토어 조회
 * GET /api/stores/:displayName
 * 
 * 표시 이름으로 특정 스토어의 정보를 조회합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 조회할 스토어의 표시 이름
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - data (object): 스토어 정보
 */
router.get("/:displayName", async (req, res) => {
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
 * 스토어 삭제
 * DELETE /api/stores/:displayName
 * 
 * 특정 스토어와 그 안의 모든 문서를 삭제합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 삭제할 스토어의 표시 이름
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - message (string): 응답 메시지
 */
router.delete("/:displayName", async (req, res) => {
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

export default router;

