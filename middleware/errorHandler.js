/**
 * 에러 핸들러 미들웨어
 *
 * Express 애플리케이션의 에러 처리를 담당하는 미들웨어입니다.
 */

/**
 * 404 핸들러
 * 정의되지 않은 경로로 요청이 들어온 경우 처리합니다.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "요청한 엔드포인트를 찾을 수 없습니다",
  });
}

/**
 * 전역 에러 핸들러
 * 서버 내부에서 발생한 모든 에러를 처리합니다.
 */
export function errorHandler(err, req, res, next) {
  console.error("서버 오류:", err);
  res.status(500).json({
    success: false,
    error: err.message || "서버 내부 오류가 발생했습니다",
  });
}
