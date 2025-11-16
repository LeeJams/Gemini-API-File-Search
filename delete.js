import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

/**
 * File Search Store 삭제 스크립트
 *
 * 이 스크립트는 특정 File Search Store를 삭제하기 위한 유틸리티입니다.
 * 주의: 스토어를 삭제하면 그 안의 모든 문서도 함께 삭제됩니다.
 *
 * 사용 방법:
 * 1. 아래 name 필드에 삭제할 스토어의 전체 이름을 입력하세요.
 * 2. node delete.js 명령으로 실행하세요.
 */

// 환경 변수 로드
dotenv.config();

// GoogleGenAI 클라이언트 초기화
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * File Search Store 삭제
 *
 * name 필드에 삭제할 스토어의 전체 이름을 입력해야 합니다.
 * 예: "fileSearchStores/ndba82dv05hj-kt6mvc3p65g5"
 *
 * force: true 옵션은 스토어를 영구적으로 삭제하기 위해 필수입니다.
 */
await ai.fileSearchStores
  .delete({
    name: "fileSearchStores/myexamplestore-4vjimtxlmg5r", // 삭제할 스토어의 전체 이름으로 변경하세요
    config: { force: true },
  })
  .then((res) => {
    console.log("✅ 스토어가 성공적으로 삭제되었습니다:", res);
  })
  .catch((err) => {
    console.error("❌ 스토어 삭제 실패:", err);
  });
