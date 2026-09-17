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

const DEAL_TYPES = ["전세", "월세", "반전세", "매매"] as const;
const RENT_TYPES = new Set(["월세", "반전세"]);

interface Agent {
  name: string;
  phone: string;
}

function serialize(listing: Listing & { photos: Photo[] }) {
  return {
    id: listing.id,
    title: listing.title,
    listingNumber: listing.listingNumber ?? undefined,
    platform: listing.platform ?? undefined,
    dealType: listing.dealType,
    deposit: listing.deposit,
    monthlyRent: listing.monthlyRent ?? undefined,
    areaSqm: listing.areaSqm ?? undefined,
    rooms: listing.rooms ?? undefined,
    floor: listing.floor ?? undefined,
    maintenanceFee: listing.maintenanceFee ?? undefined,
    maintenanceFeeIncludes: safeParse<string[]>(listing.maintenanceFeeIncludes, []),
    walkMinutes: listing.walkMinutes ?? undefined,
    nearestStation: listing.nearestStation ?? undefined,
    address: listing.address ?? undefined,
    agents: safeParse<Agent[]>(listing.agents, []),
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

const agentSchema = z.object({
  name: z.string(),
  phone: z.string(),
});

const baseFields = z.object({
  title: z.string().min(1),
  listingNumber: z.string().optional(),
  platform: z.string().optional(),
  dealType: z.enum(DEAL_TYPES),
  deposit: z.coerce.number().int().min(0).default(0),
  monthlyRent: z.coerce.number().int().min(0).optional(),
  areaSqm: z.coerce.number().min(0).optional(),
  rooms: z.coerce.number().int().min(0).optional(),
  floor: z.string().optional(),
  maintenanceFee: z.coerce.number().int().min(0).optional(),
  maintenanceFeeIncludes: z.string().optional(), // JSON string array
  walkMinutes: z.coerce.number().int().min(0).optional(),
  nearestStation: z.string().optional(),
  address: z.string().optional(),
  agents: z.string().optional(), // JSON string array of {name, phone}
  memo: z.string().optional(),
  status: z.enum(["관심", "방문예정", "방문완료", "계약진행"]).default("관심"),
  tags: z.string().optional(), // JSON string array
});

function parseAgents(raw: string | undefined): Agent[] {
  if (!raw) return [];
  const parsed = safeParse<unknown[]>(raw, []);
  const result: Agent[] = [];
  for (const item of parsed) {
    const check = agentSchema.safeParse(item);
    if (check.success && (check.data.name || check.data.phone)) result.push(check.data);
  }
  return result;
}

router.post("/", upload.array("photos", 8), async (req: AuthedRequest, res) => {
  const parsed = baseFields.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const tags = data.tags ? safeParse<string[]>(data.tags, []) : [];
  const maintenanceFeeIncludes = data.maintenanceFeeIncludes
    ? safeParse<string[]>(data.maintenanceFeeIncludes, [])
    : [];
  const agents = parseAgents(data.agents);

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
      listingNumber: data.listingNumber || null,
      platform: data.platform || null,
      dealType: data.dealType,
      deposit: data.deposit,
      monthlyRent: RENT_TYPES.has(data.dealType) ? data.monthlyRent ?? 0 : null,
      areaSqm: data.areaSqm,
      rooms: data.rooms,
      floor: data.floor || null,
      maintenanceFee: data.maintenanceFee,
      maintenanceFeeIncludes: JSON.stringify(maintenanceFeeIncludes),
      walkMinutes: data.walkMinutes,
      nearestStation: data.nearestStation || null,
      address: data.address || null,
      agents: JSON.stringify(agents),
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
  const maintenanceFeeIncludes = data.maintenanceFeeIncludes
    ? safeParse<string[]>(data.maintenanceFeeIncludes, [])
    : [];
  const agents = parseAgents(data.agents);
  const existingIds = new Set(existing.photos.map((p) => p.id));
  const photoOrder = req.body.photoOrder
    ? safeParse<string[]>(req.body.photoOrder, existing.photos.map((p) => p.id))
    : [...existing.photos.map((p) => p.id), ...files.map(() => "__new__")];

  let uploaded;
  try {
    uploaded = await Promise.all(files.map((f) => uploadImage(f.buffer)));
  } catch {
    return res.status(502).json({ error: "사진 업로드에 실패했어요." });
  }

  const keepIds = new Set(photoOrder.filter((t) => t !== "__new__" && existingIds.has(t)));
  const toRemove = existing.photos.filter((p) => !keepIds.has(p.id));
  await Promise.all(toRemove.map((p) => deleteImage(p.publicId)));
  if (toRemove.length) {
    await prisma.photo.deleteMany({ where: { id: { in: toRemove.map((p) => p.id) } } });
  }

  let nextNewIndex = 0;
  const orderUpdates: { id: string; order: number }[] = [];
  const newCreates: { url: string; publicId: string; order: number }[] = [];
  photoOrder.forEach((token, i) => {
    if (token === "__new__") {
      const u = uploaded[nextNewIndex++];
      if (u) newCreates.push({ url: u.url, publicId: u.publicId, order: i });
    } else if (keepIds.has(token)) {
      orderUpdates.push({ id: token, order: i });
    }
  });
  await Promise.all(
    orderUpdates.map((u) => prisma.photo.update({ where: { id: u.id }, data: { order: u.order } })),
  );
  if (newCreates.length) {
    await prisma.photo.createMany({
      data: newCreates.map((c) => ({ listingId: existing.id, ...c })),
    });
  }

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      listingNumber: data.listingNumber || null,
      platform: data.platform || null,
      dealType: data.dealType,
      deposit: data.deposit,
      monthlyRent: RENT_TYPES.has(data.dealType) ? data.monthlyRent ?? 0 : null,
      areaSqm: data.areaSqm,
      rooms: data.rooms,
      floor: data.floor || null,
      maintenanceFee: data.maintenanceFee,
      maintenanceFeeIncludes: JSON.stringify(maintenanceFeeIncludes),
      walkMinutes: data.walkMinutes,
      nearestStation: data.nearestStation || null,
      address: data.address || null,
      agents: JSON.stringify(agents),
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
