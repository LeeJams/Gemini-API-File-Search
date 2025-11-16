/**
 * 로깅 유틸리티
 * 
 * 서버 시작 시 엔드포인트 목록을 출력하는 로깅 함수들을 제공합니다.
 */

/**
 * 서버 시작 로그 출력
 * 
 * 서버가 시작될 때 서버 정보와 사용 가능한 엔드포인트 목록을 출력합니다.
 * 
 * @param {number} port - 서버 포트 번호
 */
export function logServerStart(port) {
  console.log(`\n🚀 Gemini File Search API 서버가 시작되었습니다`);
  console.log(`📡 서버 주소: http://localhost:${port}`);
  console.log(`📚 API 문서: http://localhost:${port}/`);
  console.log(`\n사용 가능한 엔드포인트:`);
  console.log(
    `  GET    /                                          - 헬스 체크`
  );
  console.log(
    `  POST   /api/stores                                - 스토어 생성`
  );
  console.log(
    `  GET    /api/stores                                - 스토어 목록`
  );
  console.log(
    `  GET    /api/stores/:displayName                   - 스토어 조회`
  );
  console.log(
    `  DELETE /api/stores/:displayName                   - 스토어 삭제`
  );
  console.log(
    `  POST   /api/stores/:displayName/upload            - 파일 업로드`
  );
  console.log(
    `  POST   /api/stores/:displayName/query             - 쿼리 실행 (RAG)`
  );
  console.log(
    `  GET    /api/stores/:displayName/documents         - 문서 목록`
  );
  console.log(
    `  GET    /api/stores/:displayName/documents/:doc    - 문서 조회`
  );
  console.log(
    `  DELETE /api/stores/:displayName/documents/:doc    - 문서 삭제`
  );
  console.log(
    `  PUT    /api/stores/:displayName/documents/:doc    - 문서 업데이트\n`
  );
}

