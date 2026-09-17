import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { uploadImage, deleteImage } from "../cloudinary";
import { extractListingFromImage } from "../gemini";
import type { Listing, Photo } from "@prisma/client";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("이미지 파일만 업로드할 수 있어요."));
      return;
    }
    cb(null, true);
  },
});

function serialize(listing: Listing & { photos: Photo[] }) {
  return {
    id: listing.id,
    title: listing.title,
    dealType: listing.dealType,
    deposit: listing.deposit,
    monthlyRent: listing.monthlyRent ?? undefined,
    area: listing.area ?? undefined,
    floor: listing.floor ?? undefined,
    maintenanceFee: listing.maintenanceFee ?? undefined,
    walkMinutes: listing.walkMinutes ?? undefined,
    address: listing.address ?? undefined,
    agentName: listing.agentName ?? undefined,
    agentPhone: listing.agentPhone ?? undefined,
    memo: listing.memo ?? undefined,
    tags: safeParse(listing.tags, []),
    status: listing.status,
    saved: listing.saved,
    checklist: safeParse(listing.checklist, {}),
    ratings: safeParse(listing.ratings, {}),
    visitNote: listing.visitNote ?? undefined,
    createdAt: listing.createdAt.getTime(),
    updatedAt: listing.updatedAt.getTime(),
    photos: listing.photos
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ id: p.id, url: p.url })),
  };
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadOwned(id: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!listing || listing.userId !== userId) return null;
  return listing;
}

router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const listings = await prisma.listing.findMany({
    where: { userId: req.userId! },
    include: { photos: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ listings: listings.map(serialize) });
});

router.post("/extract", upload.single("photo"), async (req: AuthedRequest, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "이미지가 필요해요." });

  try {
    const extracted = await extractListingFromImage(file.buffer, file.mimetype);
    res.json({ extracted });
  } catch (err) {
    console.error("Gemini extract failed:", err);
    res.status(502).json({ error: "이미지 분석에 실패했어요. 직접 입력해 주세요." });
  }
});

const baseFields = z.object({
  title: z.string().min(1),
  dealType: z.enum(["전세", "월세"]),
  deposit: z.coerce.number().int().min(0).default(0),
  monthlyRent: z.coerce.number().int().min(0).optional(),
  area: z.string().optional(),
  floor: z.string().optional(),
  maintenanceFee: z.coerce.number().int().min(0).optional(),
  walkMinutes: z.coerce.number().int().min(0).optional(),
  address: z.string().optional(),
  agentName: z.string().optional(),
  agentPhone: z.string().optional(),
  memo: z.string().optional(),
  status: z.enum(["관심", "방문예정", "방문완료", "계약진행"]).default("관심"),
  tags: z.string().optional(), // JSON string array
});

router.post("/", upload.array("photos", 8), async (req: AuthedRequest, res) => {
  const parsed = baseFields.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const tags = data.tags ? safeParse<string[]>(data.tags, []) : [];

  let uploaded;
  try {
    uploaded = await Promise.all(files.map((f) => uploadImage(f.buffer)));
  } catch {
    return res.status(502).json({ error: "사진 업로드에 실패했어요." });
  }

  const listing = await prisma.listing.create({
    data: {
      userId: req.userId!,
      title: data.title,
      dealType: data.dealType,
      deposit: data.deposit,
      monthlyRent: data.dealType === "월세" ? data.monthlyRent ?? 0 : null,
      area: data.area || null,
      floor: data.floor || null,
      maintenanceFee: data.maintenanceFee,
      walkMinutes: data.walkMinutes,
      address: data.address || null,
      agentName: data.agentName || null,
      agentPhone: data.agentPhone || null,
      memo: data.memo || null,
      tags: JSON.stringify(tags),
      status: data.status,
      saved: true,
      photos: {
        create: uploaded.map((u, i) => ({ url: u.url, publicId: u.publicId, order: i })),
      },
    },
    include: { photos: true },
  });

  res.status(201).json({ listing: serialize(listing) });
});

router.put("/:id", upload.array("photos", 8), async (req: AuthedRequest, res) => {
  const existing = await loadOwned(req.params.id, req.userId!);
  if (!existing) return res.status(404).json({ error: "매물을 찾을 수 없어요." });

  const parsed = baseFields.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const tags = data.tags ? safeParse<string[]>(data.tags, []) : [];
  const keepPhotoIds = req.body.keepPhotoIds
    ? safeParse<string[]>(req.body.keepPhotoIds, [])
    : existing.photos.map((p) => p.id);

  let uploaded;
  try {
    uploaded = await Promise.all(files.map((f) => uploadImage(f.buffer)));
  } catch {
    return res.status(502).json({ error: "사진 업로드에 실패했어요." });
  }

  const toRemove = existing.photos.filter((p) => !keepPhotoIds.includes(p.id));
  await Promise.all(toRemove.map((p) => deleteImage(p.publicId)));
  if (toRemove.length) {
    await prisma.photo.deleteMany({ where: { id: { in: toRemove.map((p) => p.id) } } });
  }

  const keptCount = keepPhotoIds.length;
  if (uploaded.length) {
    await prisma.photo.createMany({
      data: uploaded.map((u, i) => ({
        listingId: existing.id,
        url: u.url,
        publicId: u.publicId,
        order: keptCount + i,
      })),
    });
  }

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      dealType: data.dealType,
      deposit: data.deposit,
      monthlyRent: data.dealType === "월세" ? data.monthlyRent ?? 0 : null,
      area: data.area || null,
      floor: data.floor || null,
      maintenanceFee: data.maintenanceFee,
      walkMinutes: data.walkMinutes,
      address: data.address || null,
      agentName: data.agentName || null,
      agentPhone: data.agentPhone || null,
      memo: data.memo || null,
      tags: JSON.stringify(tags),
      status: data.status,
    },
    include: { photos: true },
  });

  res.json({ listing: serialize(listing) });
});

const patchSchema = z.object({
  status: z.enum(["관심", "방문예정", "방문완료", "계약진행"]).optional(),
  saved: z.boolean().optional(),
  memo: z.string().optional(),
  visitNote: z.string().optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  ratings: z
    .record(z.string(), z.number())
    .optional(),
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const existing = await loadOwned(req.params.id, req.userId!);
  if (!existing) return res.status(404).json({ error: "매물을 찾을 수 없어요." });

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const patch = parsed.data;

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.saved !== undefined ? { saved: patch.saved } : {}),
      ...(patch.memo !== undefined ? { memo: patch.memo } : {}),
      ...(patch.visitNote !== undefined ? { visitNote: patch.visitNote } : {}),
      ...(patch.checklist !== undefined
        ? { checklist: JSON.stringify(patch.checklist) }
        : {}),
      ...(patch.ratings !== undefined ? { ratings: JSON.stringify(patch.ratings) } : {}),
    },
    include: { photos: true },
  });

  res.json({ listing: serialize(listing) });
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const existing = await loadOwned(req.params.id, req.userId!);
  if (!existing) return res.status(404).json({ error: "매물을 찾을 수 없어요." });

  await Promise.all(existing.photos.map((p) => deleteImage(p.publicId)));
  await prisma.listing.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
