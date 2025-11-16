import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import storesRouter from "./routes/stores.js";
import uploadRouter from "./routes/upload.js";
import queryRouter from "./routes/query.js";
import documentsRouter from "./routes/documents.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { logServerStart } from "./utils/logger.js";

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Gemini File Search API 서버가 실행 중입니다",
    version: "1.0.0",
  });
});

app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload.html"));
});

app.get("/documents", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "documents.html"));
});

app.use("/api/stores", storesRouter);
app.use("/api/stores", uploadRouter);
app.use("/api/stores", queryRouter);
app.use("/api/stores", documentsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logServerStart(PORT);
});
