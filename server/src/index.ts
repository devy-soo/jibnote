import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import listingsRouter from "./routes/listings";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(PORT, () => {
  console.log(`집노트 API listening on http://localhost:${PORT}`);
});
