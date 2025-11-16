import express from "express";
import fs from "fs";
import { findStoreByDisplayName } from "../index.js";
import { uploadWithCustomChunking } from "../index.js";
import upload from "../middleware/upload.js";

/**
 * 파일 업로드 라우트
 * 
 * 스토어에 파일을 업로드하고 인덱싱하는 라우트입니다.
 */

const router = express.Router();

/**
 * 파일 업로드 (단일 또는 다중)
 * POST /api/stores/:displayName/upload
 * 
 * 스토어에 파일을 업로드하고 인덱싱합니다.
 * 여러 파일을 동시에 업로드할 수 있으며, 커스텀 청킹 옵션을 설정할 수 있습니다.
 * 
 * URL Parameters:
 *   - displayName (string): 업로드할 대상 스토어의 표시 이름
 * 
 * FormData:
 *   - files (File[]): 업로드할 파일들 (최대 10개)
 * 
 * Optional Body Parameters:
 *   - customMetadata (string, JSON): 커스텀 메타데이터 (JSON 문자열)
 *   - maxTokensPerChunk (number): 청크당 최대 토큰 수
 *   - maxOverlapTokens (number): 청크 간 최대 겹치는 토큰 수
 * 
 * Response:
 *   - success (boolean): 성공 여부
 *   - message (string): 응답 메시지
 *   - data (array): 업로드 결과 배열
 */
router.post(
  "/:displayName/upload",
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
          // 커스텀 청킹 옵션 설정
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

          // 커스텀 옵션이 있으면 커스텀 청킹으로 업로드, 없으면 기본 업로드
          await uploadWithCustomChunking(store, file.path, options);

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

export default router;

