import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /api/docs/files
 * docs 폴더의 파일 목록 조회
 */
router.get("/files", async (req, res) => {
  try {
    const docsPath = path.join(__dirname, "..", "docs");

    // docs 폴더 존재 확인
    if (!fs.existsSync(docsPath)) {
      return res.status(404).json({
        success: false,
        error: "docs 폴더를 찾을 수 없습니다",
      });
    }

    // 파일 목록 읽기
    const files = fs.readdirSync(docsPath);

    // .md 파일만 필터링하고 상세 정보 추가
    const fileList = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const filePath = path.join(docsPath, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          path: `/api/docs/file/${encodeURIComponent(file)}`,
          size: stats.size,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));

    res.json({
      success: true,
      data: fileList,
    });
  } catch (error) {
    console.error("파일 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/docs/file/:filename
 * 특정 파일의 내용 조회
 */
router.get("/file/:filename", async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const docsPath = path.join(__dirname, "..", "docs");
    const filePath = path.join(docsPath, filename);

    // 경로 탐색 공격 방지
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(docsPath)) {
      return res.status(403).json({
        success: false,
        error: "잘못된 파일 경로입니다",
      });
    }

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "파일을 찾을 수 없습니다",
      });
    }

    // 파일 읽기
    const content = fs.readFileSync(filePath, "utf-8");
    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      data: {
        name: filename,
        content: content,
        size: stats.size,
        modified: stats.mtime,
      },
    });
  } catch (error) {
    console.error("파일 읽기 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
