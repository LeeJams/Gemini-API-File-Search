# Gemini File Search JavaScript 구현

Gemini API File Search를 사용한 완전한 RAG (Retrieval-Augmented Generation) 시스템 구현입니다.

이 프로젝트는 두 가지 사용 방법을 제공합니다:

- **CLI 모드**: 커맨드라인에서 직접 실행
- **API 서버 모드**: RESTful API로 서비스 제공

## 기능

이 프로젝트는 다음 기능을 제공합니다:

1. ✅ File Search Store 생성
2. ✅ Display Name으로 Store 찾기
3. ✅ 여러 파일 동시 업로드
4. ✅ 커스텀 청킹 전략으로 업로드
5. ✅ File Search를 사용한 생성 쿼리 (RAG)
6. ✅ Store 내 특정 문서 찾기
7. ✅ 문서 삭제
8. ✅ 문서 업데이트
9. ✅ File Search Store 삭제
10. ✅ RESTful API 서버

## 설치

```bash
npm install
```

## 설정

1. `.env.example` 파일을 `.env`로 복사하세요:

```bash
cp .env.example .env
```

2. `.env` 파일에 Google AI Studio에서 발급받은 API 키를 입력하세요:

```
GEMINI_API_KEY=your_api_key_here
```

## 사용 방법 (요약)

1. **의존성 설치**
   ```bash
   npm install
   ```
2. **환경 변수 설정 (`.env`)**
   ```bash
   GEMINI_API_KEY=발급받은_API_키
   PORT=3000 # 선택, 기본값 3000
   ```
3. **개발 서버 실행 (코드 변경 감지)**
   ```bash
   npm run dev
   ```
4. **브라우저에서 접속**
   - `http://localhost:PORT/` (예: `http://localhost:3000`)
   - 스토어 선택 화면이 보이면 설정이 완료된 것 입니다.

서버를 코드 변경 감지 없이 **단순 실행**하고 싶다면 다음 스크립트를 사용할 수 있습니다.

```bash
npm run server
```

서버는 기본적으로 `http://localhost:3000`에서 실행되며, 포트를 변경하려면 `.env` 파일에 `PORT=포트번호`를 추가하세요.

---

## 웹 UI 사용법

### 1. 스토어 선택/생성 (`/`)

1. 브라우저에서 `http://localhost:3000` 접속
2. **Select Store** 화면에서:
   - 이미 만들어둔 스토어가 있다면 카드 클릭
   - 새로 만들려면 **Add Store → Store Name 입력 → Create Store** 클릭  
     (영문, 숫자, `-`, `_` 만 사용 가능)

스토어 카드를 클릭하면 해당 스토어의 **워크스페이스 화면**으로 이동합니다.

### 2. 문서 업로드 (`/documents.html?store=스토어이름`)

1. 워크스페이스 왼쪽의 **View Documents List** 버튼 클릭
2. 상단 오른쪽의 **Upload** 버튼 클릭 → 업로드 모달 열기
3. 파일 선택 후 **Upload Files** 버튼 클릭
4. 업로드가 완료되면 문서 리스트에 파일들이 표시됩니다.

업로드된 문서들은 해당 스토어의 File Search Store에 인덱싱되며, 이후 RAG 쿼리에서 검색 대상으로 사용됩니다.

### 3. 질문하기 (RAG Query, `/workspace.html?store=스토어이름`)

1. 다시 워크스페이스 화면으로 이동 (주소 예:  
   `http://localhost:3000/workspace.html?store=sellpick`)
2. 오른쪽 카드의 **질문 입력** 영역에 자유롭게 질문 작성
3. 필요하다면 **메타데이터 필터**에 필터 조건 입력 (예: `doc_type='manual'`)
4. **Execute Query** 버튼 클릭
5. 아래에 **AI Response** 카드와 함께, 필요 시 인용 정보(grounding metadata)가 표시됩니다.

### 4. 원본 문서 보기 (`Open Original Files`)

1. 워크스페이스 왼쪽 **Open Original Files** 버튼 클릭
2. `docs/` 폴더에 있는 마크다운/텍스트 파일 목록이 모달로 표시됩니다.
3. 원하는 파일을 클릭하면 상세 내용이 마크다운으로 렌더링되어 팝업에 표시됩니다.

---

## 고급 사용: 라이브러리/API로 직접 사용하기

## 프로젝트 구조

```
.
├── index.js          # 핵심 기능 구현 (라이브러리)
├── server.js         # Express API 서버
├── package.json      # 프로젝트 설정
├── .env.example      # 환경 변수 예제
├── .gitignore        # Git 무시 파일
├── README.md         # 프로젝트 문서
├── docs/             # CLI 모드용 문서 폴더
│   ├── doc1.txt
│   └── doc2.txt
└── uploads/          # API 서버 업로드 임시 폴더 (자동 생성)
```

### Node.js 코드에서 직접 사용

```javascript
import {
  createFileSearchStore,
  uploadMultipleFiles,
  generateContentWithFileSearch,
} from "./index.js";

// Store 생성
const store = await createFileSearchStore("my-store");

// 파일 업로드
await uploadMultipleFiles(store, "./docs");

// 쿼리 실행
const response = await generateContentWithFileSearch(
  store,
  "문서에 대해 설명해주세요."
);
```

### 커스텀 청킹으로 업로드

```javascript
import { uploadWithCustomChunking } from "./index.js";

await uploadWithCustomChunking(fileStore, "./docs/manual.txt", {
  displayName: "technical-manual.txt",
  customMetadata: [{ key: "doc_type", stringValue: "manual" }],
  maxTokensPerChunk: 500,
  maxOverlapTokens: 50,
});
```

### 메타데이터 필터 사용

```javascript
const response = await generateContentWithFileSearch(
  fileStore,
  "매뉴얼에 따르면 기기를 리셋하는 방법은?",
  'doc_type="manual"' // 메타데이터 필터
);
```

## API 서버 사용 예제 (REST 호출)

### 1. 스토어 생성

```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{"displayName": "my-store"}'
```

### 2. 스토어 목록 조회

```bash
curl http://localhost:3000/api/stores
```

### 3. 파일 업로드

```bash
curl -X POST http://localhost:3000/api/stores/my-store/upload \
  -F "files=@./docs/doc1.txt" \
  -F "files=@./docs/doc2.txt"
```

### 4. 쿼리 실행 (RAG)

```bash
curl -X POST http://localhost:3000/api/stores/my-store/query \
  -H "Content-Type: application/json" \
  -d '{"query": "업로드된 문서들에 대해 요약해주세요."}'
```

### 5. 문서 목록 조회

```bash
curl http://localhost:3000/api/stores/my-store/documents
```

### 6. 문서 삭제

```bash
curl -X DELETE http://localhost:3000/api/stores/my-store/documents/doc1.txt
```

### 7. 스토어 삭제

```bash
curl -X DELETE http://localhost:3000/api/stores/my-store
```

## API 엔드포인트 문서

### 스토어 관리

| 메서드   | 엔드포인트                 | 설명             | Body/Params               |
| -------- | -------------------------- | ---------------- | ------------------------- |
| `GET`    | `/`                        | 헬스 체크        | -                         |
| `POST`   | `/api/stores`              | 스토어 생성      | `{ displayName: string }` |
| `GET`    | `/api/stores`              | 스토어 목록 조회 | -                         |
| `GET`    | `/api/stores/:displayName` | 특정 스토어 조회 | -                         |
| `DELETE` | `/api/stores/:displayName` | 스토어 삭제      | -                         |

### 파일 및 문서 관리

| 메서드   | 엔드포인트                                | 설명                    | Body/Params         |
| -------- | ----------------------------------------- | ----------------------- | ------------------- |
| `POST`   | `/api/stores/:displayName/upload`         | 파일 업로드 (최대 10개) | FormData: `files[]` |
| `GET`    | `/api/stores/:displayName/documents`      | 문서 목록 조회          | -                   |
| `GET`    | `/api/stores/:displayName/documents/:doc` | 특정 문서 조회          | -                   |
| `PUT`    | `/api/stores/:displayName/documents/:doc` | 문서 업데이트           | FormData: `file`    |
| `DELETE` | `/api/stores/:displayName/documents/:doc` | 문서 삭제               | -                   |

### 쿼리 (RAG)

| 메서드 | 엔드포인트                       | 설명          | Body                                         |
| ------ | -------------------------------- | ------------- | -------------------------------------------- |
| `POST` | `/api/stores/:displayName/query` | RAG 쿼리 실행 | `{ query: string, metadataFilter?: string }` |

### 응답 형식

모든 API 응답은 다음 형식을 따릅니다:

**성공 응답**

```json
{
  "success": true,
  "message": "작업 설명",
  "data": {
    /* 응답 데이터 */
  }
}
```

**에러 응답**

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 비용 정보

- 파일 저장 및 쿼리 시 임베딩 생성: **무료**
- 초기 파일 인덱싱: **$0.15 per 1M tokens** (임베딩 기준)

## 제한 사항

- 프로젝트당 최대 **10개의 File Search Store** 제한
- 개발 완료 후 Store를 삭제하여 리소스를 정리하세요

## 참고 자료

- [Gemini File Search 튜토리얼](https://www.philschmid.de/gemini-file-search-javascript)
- [Google AI Studio](https://aistudio.google.com/)

## 라이선스

MIT
