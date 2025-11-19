# Gemini File Search - Next.js 16

**Google Gemini API를 활용한 현대적인 RAG (Retrieval-Augmented Generation) 시스템**

Next.js 16, TypeScript, Zustand, Tailwind CSS로 구축된 문서 저장, 인덱싱, AI 기반 질의응답 플랫폼입니다.

## ✨ 주요 기능

- 🚀 **Next.js 16** App Router + React 19
- 💎 **TypeScript** strict mode로 완벽한 타입 안전성
- 🎨 **Tailwind CSS** + **shadcn/ui**로 세련된 UI
- 🌙 **다크모드** 지원 (next-themes)
- 📁 **File Search Store** 관리 (생성, 조회, 삭제)
- 📤 **멀티 파일 업로드** (커스텀 청킹 전략)
- 🤖 **RAG 기반 쿼리** (메타데이터 필터링 지원)
- 📝 **문서 CRUD** 작업
- ⚡ **서버 사이드 캐싱**으로 최적화된 성능
- 🔄 **API Route Handlers**로 RESTful 엔드포인트 제공
- 📊 **마크다운 렌더링** 및 인용 추적

## 📋 필수 요구사항

- Node.js 18.17 이상
- npm 9.0 이상
- Gemini API 키 ([여기서 발급받기](https://aistudio.google.com/))

## 🚀 빠른 시작

### 1. 설치

```bash
# 의존성 설치
npm install
```

### 2. 환경 변수 설정

```bash
# 환경 변수 파일 생성
cp .env.local.example .env.local

# .env.local 파일을 열어서 API 키 입력
# GEMINI_API_KEY=your_actual_api_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하세요.

## 📁 프로젝트 구조

```
├── app/                      # Next.js App Router
│   ├── api/                  # API Route Handlers
│   │   ├── health/           # 헬스 체크
│   │   └── stores/           # Store 관련 API
│   ├── stores/               # Store 목록 페이지
│   ├── workspace/            # RAG 쿼리 페이지
│   ├── documents/            # 문서 관리 페이지
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 홈 페이지
│   └── globals.css           # 전역 스타일
│
├── components/               # React 컴포넌트
│   ├── ui/                   # shadcn/ui 컴포넌트
│   └── providers.tsx         # 전역 프로바이더
│
├── lib/                      # 핵심 로직
│   ├── gemini.ts             # Gemini API 통합
│   └── utils.ts              # 유틸리티 함수
│
├── store/                    # Zustand 상태 관리
│   ├── slices/               # 상태 슬라이스
│   └── index.ts              # 메인 스토어
│
├── types/                    # TypeScript 타입 정의
│   ├── gemini.ts
│   ├── api.ts
│   └── store.ts
│
├── next.config.ts            # Next.js 설정
├── tailwind.config.ts        # Tailwind 설정
└── tsconfig.json             # TypeScript 설정
```

## 🎯 사용 가능한 스크립트

```bash
# 개발
npm run dev              # Turbopack으로 개발 서버 시작
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 시작

# 코드 품질
npm run lint             # ESLint 실행
npm run format           # Prettier로 코드 포맷팅
npm run type-check       # TypeScript 타입 체크
```

## 📱 페이지 구조

### 1. Stores 페이지 (`/stores`)
- File Search Store 목록 조회
- 새 스토어 생성
- 기존 스토어 삭제
- 스토어 카드 클릭으로 워크스페이스 이동

### 2. Workspace 페이지 (`/workspace/{storeName}`)
- RAG 쿼리 실행
- AI 응답을 마크다운으로 렌더링
- 메타데이터 필터링 지원
- 쿼리 히스토리 관리
- 인용 및 grounding 메타데이터 표시

### 3. Documents 페이지 (`/documents/{storeName}`)
- 파일 업로드 (최대 10개, 각 50MB)
- 문서 목록 조회
- 문서 관리 (업데이트, 삭제 예정)

## 🔌 API 엔드포인트

### 헬스 체크
```
GET /api/health
```

### Store 관리
```
GET    /api/stores                      # 모든 스토어 조회
POST   /api/stores                      # 스토어 생성
GET    /api/stores/:displayName         # 특정 스토어 조회
DELETE /api/stores/:displayName         # 스토어 삭제
```

### 파일 업로드
```
POST   /api/stores/:displayName/upload  # 파일 업로드 (최대 10개, 각 50MB)
```

### RAG 쿼리
```
POST   /api/stores/:displayName/query
Body: {
  "query": "질문 내용",
  "metadataFilter": "doc_type='manual'" (선택사항)
}
```

### 문서 관리
```
GET    /api/stores/:displayName/documents  # 문서 목록 조회
```

### API 응답 형식

**성공 응답**
```json
{
  "success": true,
  "message": "작업 설명",
  "data": { /* 응답 데이터 */ }
}
```

**에러 응답**
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 🎨 UI 컴포넌트 (shadcn/ui)

프로젝트에 포함된 컴포넌트:
- **Button** - 다양한 변형 (default, outline, ghost 등)
- **Input** - 검증 기능이 있는 폼 입력
- **Label** - 접근 가능한 폼 레이블
- **Dialog** - 모달 다이얼로그
- **Card** - 콘텐츠 컨테이너
- **Select** - 드롭다운 선택
- **Toast** - 알림 메시지

추가 컴포넌트 설치:
```bash
npx shadcn@latest add [컴포넌트명]

# 예시:
npx shadcn@latest add progress
npx shadcn@latest add tabs
npx shadcn@latest add badge
```

## 🗂️ 상태 관리 (Zustand)

### 슬라이스 구조
1. **UI State** - 로딩, 에러 상태 (미저장)
2. **Stores State** - 스토어 목록, 현재 스토어 (로컬 저장)
3. **Documents State** - 문서 목록 (미저장)
4. **Query State** - 쿼리 히스토리 (로컬 저장)

### 사용 예시
```typescript
import { useStoresState, useUIState } from "@/store";

function MyComponent() {
  const { stores, setStores } = useStoresState();
  const { isLoading, setLoading } = useUIState();

  // 비즈니스 로직
}
```

## 🌙 다크모드

next-themes를 사용한 다크모드 토글:

```typescript
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      테마 전환
    </button>
  );
}
```

## 🔧 설정

### TypeScript
- Strict mode 활성화
- Path aliases 설정 (@/*)
- 타입 안전성 보장

### ESLint
- Next.js 권장 규칙
- TypeScript 통합
- Prettier 통합

### Tailwind CSS
- 커스텀 컬러 스킴
- 다크모드 지원
- 커스텀 애니메이션
- 반응형 유틸리티

## 📝 환경 변수

### 필수
```bash
GEMINI_API_KEY=your_api_key     # Gemini API 키
```

### 선택사항
```bash
NODE_ENV=development            # 환경 모드
NEXT_PUBLIC_API_URL=http://...  # API 기본 URL
```

## 🐛 문제 해결

### Module not found 오류
```bash
rm -rf .next node_modules package-lock.json
npm install
```

### TypeScript 오류
```bash
npm run type-check
```

### PostCSS 오류
```bash
rm -rf node_modules package-lock.json .next
npm install
```

### 스타일 문제
```bash
# 개발 서버 재시작
# tailwind.config.ts의 content 경로 확인
```

### 캐시 문제
```bash
rm -rf .next
npm run dev
```

## 💰 비용 정보

- 파일 저장 및 쿼리 시 임베딩 생성: **무료**
- 초기 파일 인덱싱: **$0.15 per 1M tokens**

## ⚠️ 제한 사항

- 프로젝트당 최대 **10개의 File Search Store**
- 파일당 최대 **50MB**
- 업로드당 최대 **10개 파일**
- 개발 완료 후 미사용 Store 삭제 권장

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Zustand 문서](https://zustand.docs.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)

## 🤝 기여하기

1. 기능 브랜치 생성
2. 변경사항 작성
3. Lint 및 타입 체크 실행
4. Pull Request 제출

## 📄 라이선스

MIT

---
