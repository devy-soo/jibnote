import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import listingsRouter from "./routes/listings";
import preferencesRouter from "./routes/preferences";

const app = express();

// 배포된 클라이언트 도메인 + 로컬/같은 와이파이 LAN에서의 개발 테스트(휴대폰 미리보기 등)만 허용.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "https://jipnote.up.railway.app")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const LOCAL_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CLIENT_ORIGINS.includes(origin) || LOCAL_ORIGIN_PATTERN.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: 허용되지 않은 origin입니다."));
      }
    },
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/preferences", preferencesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message.startsWith("CORS:")) {
    return res.status(403).json({ error: "허용되지 않은 요청이에요." });
  }
  console.error(err);
  res.status(500).json({ error: "서버 오류가 발생했어요." });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(PORT, () => {
  console.log(`집노트 API listening on http://localhost:${PORT}`);
});
