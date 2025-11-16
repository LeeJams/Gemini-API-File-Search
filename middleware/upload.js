import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 파일 업로드 미들웨어 설정
 *
 * Multer를 사용한 파일 업로드 설정을 제공합니다.
 */

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 업로드 디렉토리 설정 및 생성
 * 업로드된 파일은 임시로 이 디렉토리에 저장된 후 처리됩니다.
 */
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer 설정 - 파일 업로드 미들웨어
 *
 * - destination: 업로드된 파일을 저장할 디렉토리
 * - filename: 고유한 파일명 생성 (타임스탬프 + 랜덤 숫자 + 원본 파일명)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

/**
 * Multer 인스턴스 생성
 * - 파일 크기 제한: 50MB
 */
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 제한
});

export default upload;
export { uploadDir };
