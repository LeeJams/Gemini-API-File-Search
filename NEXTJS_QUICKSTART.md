# Next.js 16 실행 가이드

## ✅ 수정 완료!

Tailwind CSS 버전 문제를 해결했습니다.

### 변경사항
1. ✅ Tailwind CSS 버전을 **3.4.15**로 정확히 고정 (4.x 방지)
2. ✅ `postcss.config.mjs` 간소화 (Next.js 16 호환)
3. ✅ `node_modules` 재설치로 의존성 정리

---

## 🚀 실행 방법

```bash
# 1. 환경 변수 설정 (처음 한 번만)
cp .env.local.example .env.local
# .env.local 파일을 열어서 GEMINI_API_KEY 입력

# 2. Next.js 개발 서버 실행
npm run dev

# 3. 브라우저에서 접속
# http://localhost:3000
```

---

## 📱 페이지 구조

접속하면 자동으로 `/stores` 페이지로 리다이렉트됩니다:

1. **Stores 페이지** (`/stores`)
   - File Search Store 목록
   - 새 스토어 추가
   - 스토어 삭제

2. **Workspace 페이지** (`/workspace/{storeName}`)
   - RAG 쿼리 실행
   - 마크다운 응답 렌더링
   - 쿼리 히스토리

3. **Documents 페이지** (`/documents/{storeName}`)
   - 파일 업로드 (최대 10개, 50MB)
   - 문서 목록 및 관리

---

## 🎨 기능

- ✅ **다크모드**: 헤더 오른쪽 상단 토글 버튼
- ✅ **로딩 상태**: 전역 오버레이로 표시
- ✅ **에러 핸들링**: Toast 알림 (추가 예정)
- ✅ **반응형 디자인**: 모바일/태블릿/데스크톱 대응
- ✅ **타입 안전성**: TypeScript strict mode

---

## 🔧 기타 명령어

```bash
# 타입 체크
npm run type-check

# Lint
npm run lint

# 코드 포맷팅
npm run format

# 프로덕션 빌드
npm run build
npm run start
```

---

## 🐛 문제 해결

### PostCSS 오류 발생 시
```bash
rm -rf node_modules package-lock.json .next
npm install
```

### 타입 오류 발생 시
```bash
npm run type-check
```

### 캐시 문제 시
```bash
rm -rf .next
npm run dev
```

---

**이제 `npm run dev`로 즉시 실행 가능합니다!** 🎉
