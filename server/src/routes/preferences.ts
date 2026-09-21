import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

const preferencesSchema = z.object({
  maxDeposit: z.number().int().min(0).optional(),
  maxMonthlyRent: z.number().int().min(0).optional(),
  minAreaSqm: z.number().min(0).optional(),
  minRooms: z.number().int().min(0).optional(),
  minFloor: z.number().int().optional(),
  desiredDirection: z.string().optional(),
  desiredStation: z.string().optional(),
  requiredOptions: z.array(z.string()).default([]),
  requireParking: z.boolean().optional(),
});

function safeParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

router.get("/", async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  res.json({ preferences: safeParse(user.preferences) });
});

router.put("/", async (req: AuthedRequest, res) => {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { preferences: JSON.stringify(parsed.data) },
  });
  res.json({ preferences: safeParse(user.preferences) });
});

export default router;
