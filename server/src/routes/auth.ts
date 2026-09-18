import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signToken, requireAuth, AuthedRequest } from "../middleware/auth";
import { deleteImage } from "../cloudinary";

const router = Router();

function toPublicUser(user: { id: string; email: string }) {
  return { id: user.id, email: user.email };
}

const credentialsSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
});

router.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const email = parsed.data.email.toLowerCase().trim();
  const { password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "이미 가입된 이메일입니다." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const token = signToken(user.id);
  res.status(201).json({ token, user: toPublicUser(user) });
});

router.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
  }
  const email = parsed.data.email.toLowerCase().trim();
  const { password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  const token = signToken(user.id);
  res.json({ token, user: toPublicUser(user) });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  res.json({ user: toPublicUser(user) });
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

router.delete("/me", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = deleteAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  }

  const listings = await prisma.listing.findMany({
    where: { userId: user.id },
    include: { photos: true },
  });
  const photos = listings.flatMap((l) => l.photos);
  await Promise.all(photos.map((p) => deleteImage(p.publicId)));

  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
});

export default router;
