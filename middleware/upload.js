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
 * 지원되는 MIME 타입 목록
 * Gemini File Search API가 지원하는 파일 타입
 */
const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'application/pdf',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * 파일 필터 - MIME 타입 검증
 */
const fileFilter = (req, file, cb) => {
  // MIME 타입 확인
  if (SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`지원되지 않는 파일 형식입니다: ${file.mimetype}`), false);
  }
};

/**
 * Multer 인스턴스 생성
 * - 파일 크기 제한: 20MB (Gemini API 제한)
 * - MIME 타입 검증
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB 제한 (Gemini API 제한)
    files: 10, // 최대 10개 파일
  },
  fileFilter,
});

export default upload;
export { uploadDir };
