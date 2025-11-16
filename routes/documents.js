import express from "express";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import {
  findStoreByDisplayName,
  findDocumentByDisplayName,
  deleteDocument,
  updateDocument,
} from "../index.js";
import upload from "../middleware/upload.js";

/**
 * 문서 관련 라우트
 * 
 * 스토어 내 문서의 조회, 삭제, 업데이트를 처리하는 라우트입니다.
 */

const router = express.Router();

// GoogleGenAI 클라이언트 초기화 (문서 목록 조회에 필요)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * 스토어 내 문서 목록 조회
 * GET /api/stores/:displayName/documents
 * 
 * 특정 스토어에 업로드된 모든 문서 목록을 조회합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 문서 목록을 조회할 스토어의 표시 이름
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - data (array): 문서 목록 배열
 *   - count (number): 문서 개수
 */
router.get("/:displayName/documents", async (req, res) => {
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
 * 특정 문서 조회
 * GET /api/stores/:displayName/documents/:docDisplayName
 * 
 * 스토어 내에서 특정 문서의 정보를 조회합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 문서가 속한 스토어의 표시 이름
 *   - docDisplayName (string): 조회할 문서의 표시 이름
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - data (object): 문서 정보
 */
router.get("/:displayName/documents/:docDisplayName", async (req, res) => {
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
});

/**
 * 문서 삭제
 * DELETE /api/stores/:displayName/documents/:docDisplayName
 * 
 * 스토어에서 특정 문서를 삭제합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 문서가 속한 스토어의 표시 이름
 *   - docDisplayName (string): 삭제할 문서의 표시 이름
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - message (string): 응답 메시지
 */
router.delete("/:displayName/documents/:docDisplayName", async (req, res) => {
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
});

/**
 * 문서 업데이트
 * PUT /api/stores/:displayName/documents/:docDisplayName
 * 
 * 기존 문서를 새 버전으로 교체합니다.
 * 기존 문서를 삭제한 후 새 파일을 업로드하는 방식으로 동작합니다.
 * 
 * URL Parameters:
 *   - displayName (string): 문서가 속한 스토어의 표시 이름
 *   - docDisplayName (string): 업데이트할 문서의 표시 이름
 * 
 * FormData:
 *   - file (File): 새 버전 파일
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - message (string): 응답 메시지
 */
router.put(
  "/:displayName/documents/:docDisplayName",
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

export default router;

