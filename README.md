# Gemini File Search Manager

**A modern web-based management tool for Google's Gemini File Search API**

> 🔒 **Privacy-First**: Your API key and all data are stored only in your browser's local storage. No database, no backend storage, completely client-side secure.

An intuitive interface to manage File Search Stores, upload documents, and query them using Google's powerful Gemini AI with RAG (Retrieval-Augmented Generation) capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[English](#english) | [한국어](#korean) | [中文](#chinese) | [日本語](#japanese)

---

## <a name="english"></a>🌟 Features

### 🔐 Privacy & Security

- **No Backend Database**: All data stays in your browser
- **Client-Side Storage**: API keys stored securely in browser local storage only
- **No Data Collection**: Your documents and queries never touch our servers

### 🚀 Core Features

- **📁 Store Management**: Create, view, and delete File Search Stores with ease
- **📤 Document Upload**: Drag & drop multiple files (up to 10 files, 50MB each)
- **🤖 AI-Powered Search**: Query your documents using Gemini's RAG capabilities
- **🌍 Multilingual**: Full support for Korean, English, Chinese, and Japanese
- **🌙 Dark Mode**: Eye-friendly theme switching
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Fast**: Built with Next.js 16 and React 19 for optimal performance

---

## 📋 Prerequisites

- **Node.js** 18.17 or higher
- **npm** 9.0 or higher
- **Gemini API Key** - Get yours at [Google AI Studio](https://aistudio.google.com/apikey)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/LeeJams/Gemini-API-File-Search.git
cd Gemini-API-File-Search
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Enter Your API Key

On first visit, you'll be prompted to enter your Gemini API Key. This key is:

- ✅ Stored only in your browser's local storage
- ✅ Never sent to any backend server
- ✅ Only used for direct API calls to Google's Gemini API

> **Get Your API Key**: Visit [Google AI Studio](https://aistudio.google.com/apikey) to generate a free API key.

---

## 📖 How to Use

### Step 1: Create a File Search Store

1. Click **"Add New Store"** on the Stores page
2. Enter a unique store name (alphanumeric, hyphens, and underscores only)
3. Click **"Create"**

### Step 2: Upload Documents

1. Click **"Document Management"** on your store card
2. Drag and drop files or click to browse
3. Select up to 10 files (max 50MB each)
4. Click **"Upload"**

**Supported file types**: `.md`, `.txt`, `.pdf`, `.csv`, `.json`, `.html`, `.doc`, `.docx`, `.xls`, `.xlsx`

### Step 3: Query Your Documents

1. Click **"Query Workspace"** on your store card
2. Type your question in the query input
3. (Optional) Add metadata filters for more precise results
4. Press **Enter** or click **Send**
5. View AI-generated responses with source citations

### Step 4: Manage Your Data

- **View Documents**: Check all uploaded documents with details (size, date, metadata)
- **Delete Documents**: Remove individual documents you no longer need
- **Delete Stores**: Remove entire stores when done with a project
- **Query History**: Access your previous queries in the sidebar

---

## 🌍 Language Support

This application supports **4 languages** with complete UI translation:

- 🇰🇷 **Korean** (한국어) - Default
- 🇺🇸 **English**
- 🇨🇳 **Chinese** (中文)
- 🇯🇵 **Japanese** (日本語)

**Switch languages** using the language selector in the header.

---

## 💰 Pricing

Google Gemini File Search API pricing:

- **File Storage & Embeddings**: Free
- **Initial File Indexing**: $0.15 per 1M tokens
- **Query Execution**: Based on Gemini model usage

> **Tip**: Delete unused stores to avoid unnecessary costs.

---

## ⚠️ Limitations

- Maximum **10 File Search Stores** per project
- Maximum **50MB** per file
- Maximum **10 files** per upload
- Some file types may have size/content restrictions

---

## 🎨 Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
```

---

## 🐛 Troubleshooting

### API Key Issues

- Make sure your API key starts with `AIza`
- Verify the key is active at [Google AI Studio](https://aistudio.google.com/apikey)
- Clear browser cache and re-enter the key

### Upload Failures

- Check file size (max 50MB per file)
- Ensure file type is supported
- Try uploading fewer files at once

### Module Not Found

```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Clear Local Storage (Reset Everything)

Open browser console and run:

```javascript
localStorage.clear();
```

Then refresh the page.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📚 Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

<a name="korean"></a>

## 한국어

Google의 Gemini File Search API를 쉽게 관리할 수 있는 웹 기반 도구입니다.

**🔒 개인정보 보호**: API 키와 모든 데이터는 브라우저 로컬 스토리지에만 저장됩니다. 데이터베이스나 백엔드 서버에는 절대 저장되지 않습니다.

### 주요 기능

- 파일 검색 스토어 생성/관리/삭제
- 문서 업로드 (파일당 최대 50MB, 최대 10개)
- Gemini AI를 사용한 문서 질의응답
- 한국어, 영어, 중국어, 일본어 지원
- 다크모드 지원

자세한 사용법은 위의 영문 섹션을 참고하세요.

---

<a name="chinese"></a>

## 中文

基于 Web 的 Google Gemini File Search API 管理工具。

**🔒 隐私优先**：您的 API 密钥和所有数据仅存储在浏览器的本地存储中。没有数据库，没有后端存储，完全客户端安全。

### 主要功能

- 创建/管理/删除文件搜索存储库
- 上传文档（每个文件最大 50MB，最多 10 个）
- 使用 Gemini AI 查询文档
- 支持韩语、英语、中文、日语
- 支持深色模式

详细使用方法请参考上面的英文部分。

---

<a name="japanese"></a>

## 日本語

Google の Gemini File Search API を簡単に管理できる Web ベースのツールです。

**🔒 プライバシー重視**：API キーとすべてのデータはブラウザのローカルストレージにのみ保存されます。データベースやバックエンドストレージはなく、完全にクライアント側で安全です。

### 主な機能

- ファイル検索ストアの作成/管理/削除
- ドキュメントのアップロード（ファイルあたり最大50MB、最大10個）
- Gemini AI を使用したドキュメントクエリ
- 韓国語、英語、中国語、日本語に対応
- ダークモード対応

詳しい使用方法は上記の英語セクションをご参照ください。

---

Made with ❤️ by [LeeJams](https://github.com/LeeJams)
