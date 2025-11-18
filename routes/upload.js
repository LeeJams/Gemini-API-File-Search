import express from "express";
import fs from "fs";
import multer from "multer";
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
  (req, res, next) => {
    upload.array("files", 10)(req, res, (err) => {
      if (err) {
        // Multer 에러 처리
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              error: "파일 크기가 20MB를 초과합니다",
            });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              success: false,
              error: "최대 10개의 파일만 업로드할 수 있습니다",
            });
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
              success: false,
              error: "예상치 못한 필드명입니다. 'files' 필드를 사용하세요",
            });
          }
        }
        // 파일 필터 에러 (MIME 타입)
        return res.status(400).json({
          success: false,
          error: err.message || "파일 업로드 중 오류가 발생했습니다",
        });
      }
      next();
    });
  },
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
        let filePath = file.path;
        try {
          // 커스텀 청킹 옵션 설정 및 검증
          const options = {};
          if (req.body.customMetadata) {
            try {
              options.customMetadata = JSON.parse(req.body.customMetadata);
            } catch (e) {
              throw new Error("customMetadata는 유효한 JSON이어야 합니다");
            }
          }
          if (req.body.maxTokensPerChunk) {
            const value = parseInt(req.body.maxTokensPerChunk);
            if (value < 100 || value > 2000) {
              throw new Error("maxTokensPerChunk는 100~2000 사이여야 합니다");
            }
            options.maxTokensPerChunk = value;
          }
          if (req.body.maxOverlapTokens) {
            const value = parseInt(req.body.maxOverlapTokens);
            if (value < 0 || value > 500) {
              throw new Error("maxOverlapTokens는 0~500 사이여야 합니다");
            }
            options.maxOverlapTokens = value;
          }

          // 커스텀 옵션이 있으면 커스텀 청킹으로 업로드, 없으면 기본 업로드
          await uploadWithCustomChunking(store, file.path, options);

          uploadResults.push({
            filename: file.originalname,
            status: "success",
          });

          // 업로드 후 임시 파일 삭제 (안전하게)
          try {
            if (fs.existsSync(filePath)) {
              await fs.promises.unlink(filePath);
            }
          } catch (unlinkError) {
            console.warn(`임시 파일 삭제 실패: ${filePath}`, unlinkError.message);
          }
        } catch (error) {
          uploadResults.push({
            filename: file.originalname,
            status: "error",
            error: error.message,
          });

          // 에러 발생 시에도 임시 파일 정리
          try {
            if (fs.existsSync(filePath)) {
              await fs.promises.unlink(filePath);
            }
          } catch (unlinkError) {
            console.warn(`임시 파일 삭제 실패: ${filePath}`, unlinkError.message);
          }
        }
      }

      const hasError = uploadResults.some(
        (result) => result.status === "error"
      );

      if (hasError) {
        const errorDetails = uploadResults
          .filter((result) => result.status === "error")
          .map((result) => `${result.filename}: ${result.error}`)
          .join(", ");

        return res.status(500).json({
          success: false,
          error: `일부 파일 업로드에 실패했습니다: ${errorDetails}`,
          data: uploadResults,
        });
      }

      return res.json({
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

