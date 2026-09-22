import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { ImageCropModal } from "../components/ImageCropModal";
import { useListingStore } from "../store/useListingStore";
import { useToast } from "../components/ToastProvider";
import { useObjectUrls } from "../lib/useObjectUrls";
import { resolveUploadUrl } from "../api/client";
import { extractListingFromPhoto, extractListingFromUrl } from "../api/extract";
import type { ExtractedListing } from "../api/extract";
import { fetchPhotoFromUrl } from "../api/photoUrl";
import { STATUS_OPTIONS } from "../constants/statuses";
import { DEAL_TYPES, RENT_TYPES, depositLabel } from "../constants/dealTypes";
import {
  PLATFORM_PRESETS,
  MAINTENANCE_FEE_ITEMS,
  BUILDING_TYPE_PRESETS,
  OPTION_ITEMS,
  DIRECTION_PRESETS,
} from "../constants/platforms";
import { sqmToPyeong } from "../lib/format";
import { cropImageByBox } from "../lib/cropImage";
import type { Agent, DealType, ListingStatus } from "../types";

const MAX_PHOTOS = 8;
const EMPTY_AGENT: Agent = { name: "", phone: "" };

type PhotoItem =
  | { key: string; kind: "existing"; id: string; url: string }
  | { key: string; kind: "new"; file: File };

function createKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const listings = useListingStore((s) => s.listings);
  const loaded = useListingStore((s) => s.loaded);
  const createListing = useListingStore((s) => s.createListing);
  const editListing = useListingStore((s) => s.editListing);

  const existing = useMemo(
    () => (id ? listings.find((l) => l.id === id) : undefined),
    [id, listings],
  );

  const [title, setTitle] = useState("");
  const [listingNumber, setListingNumber] = useState("");
  const [platform, setPlatform] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [dealType, setDealType] = useState<DealType>("월세");
  const [deposit, setDeposit] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [rooms, setRooms] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [direction, setDirection] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [approvalDate, setApprovalDate] = useState("");
  const [isViolationBuilding, setIsViolationBuilding] = useState<boolean | undefined>(undefined);
  const [isFakeListing, setIsFakeListing] = useState<boolean | undefined>(undefined);
  const [parkingAvailable, setParkingAvailable] = useState<boolean | undefined>(undefined);
  const [options, setOptions] = useState<string[]>([]);
  const [maintenanceFee, setMaintenanceFee] = useState("");
  const [maintenanceFeeIncludes, setMaintenanceFeeIncludes] = useState<string[]>([]);
  const [walkMinutes, setWalkMinutes] = useState("");
  const [nearestStation, setNearestStation] = useState("");
  const [address, setAddress] = useState("");
  const [agents, setAgents] = useState<Agent[]>([EMPTY_AGENT]);
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState<ListingStatus>("관심");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [addingPhotoFromUrl, setAddingPhotoFromUrl] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [cropKey, setCropKey] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [capturePreviewOpen, setCapturePreviewOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [listingUrlInput, setListingUrlInput] = useState("");
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [step, setStep] = useState<"capture" | "form">(isEdit ? "form" : "capture");

  useEffect(() => {
    if (isEdit && existing && !hydrated) {
      setTitle(existing.title);
      setListingNumber(existing.listingNumber ?? "");
      setPlatform(existing.platform ?? "");
      setSourceUrl(existing.sourceUrl ?? "");
      setBuildingType(existing.buildingType ?? "");
      setDealType(existing.dealType);
      setDeposit(existing.deposit ? String(existing.deposit) : "");
      setMonthlyRent(existing.monthlyRent ? String(existing.monthlyRent) : "");
      setAreaSqm(existing.areaSqm != null ? String(existing.areaSqm) : "");
      setRooms(existing.rooms != null ? String(existing.rooms) : "");
      setFloorNumber(existing.floorNumber != null ? String(existing.floorNumber) : "");
      setDirection(existing.direction ?? "");
      setTotalFloors(existing.totalFloors != null ? String(existing.totalFloors) : "");
      setApprovalDate(existing.approvalDate ?? "");
      setIsViolationBuilding(existing.isViolationBuilding ?? undefined);
      setIsFakeListing(existing.isFakeListing ?? undefined);
      setParkingAvailable(existing.parkingAvailable ?? undefined);
      setOptions(existing.options ?? []);
      setMaintenanceFee(existing.maintenanceFee ? String(existing.maintenanceFee) : "");
      setMaintenanceFeeIncludes(existing.maintenanceFeeIncludes ?? []);
      setWalkMinutes(existing.walkMinutes ? String(existing.walkMinutes) : "");
      setNearestStation(existing.nearestStation ?? "");
      setAddress(existing.address ?? "");
      setAgents(existing.agents.length ? existing.agents : [EMPTY_AGENT]);
      setMemo(existing.memo ?? "");
      setStatus(existing.status);
      setTags(existing.tags);
      setPhotos(
        existing.photos.map((p) => ({ key: p.id, kind: "existing" as const, id: p.id, url: p.url })),
      );
      setHydrated(true);
    }
  }, [isEdit, existing, hydrated]);

  const newFilesInOrder = useMemo(
    () => photos.filter((p): p is Extract<PhotoItem, { kind: "new" }> => p.kind === "new"),
    [photos],
  );
  const newFileUrls = useObjectUrls(newFilesInOrder.map((p) => p.file));
  const captureFileArr = useMemo(() => (captureFile ? [captureFile] : []), [captureFile]);
  const captureUrl = useObjectUrls(captureFileArr)[0];

  function displayUrl(item: PhotoItem): string {
    if (item.kind === "existing") return resolveUploadUrl(item.url);
    const idx = newFilesInOrder.findIndex((p) => p.key === item.key);
    return newFileUrls[idx] ?? "";
  }

  const previewUrls = photos.map(displayUrl);
  const areaSqmNum = Number(areaSqm);
  const pyeongPreview = areaSqmNum > 0 ? sqmToPyeong(areaSqmNum) : null;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const room = Math.max(0, MAX_PHOTOS - photos.length);
    const next = Array.from(files)
      .slice(0, room)
      .map((file) => ({ key: createKey(), kind: "new" as const, file }));
    setPhotos((prev) => [...prev, ...next]);
  }

  async function handleAddPhotoUrl() {
    const url = photoUrlInput.trim();
    if (!url || photos.length >= MAX_PHOTOS) return;
    setAddingPhotoFromUrl(true);
    try {
      const file = await fetchPhotoFromUrl(url);
      setPhotos((prev) => [...prev, { key: createKey(), kind: "new" as const, file }]);
      setPhotoUrlInput("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "이미지를 불러오지 못했어요");
    } finally {
      setAddingPhotoFromUrl(false);
    }
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  function setPrimary(key: string) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.key === key);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  function replaceWithCropped(key: string, blob: Blob) {
    const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? { key: createKey(), kind: "new" as const, file } : p)),
    );
    setCropKey(null);
  }

  function updateAgent(i: number, field: keyof Agent, value: string) {
    setAgents((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  }

  function toggleAgentContacted(i: number) {
    setAgents((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, contacted: !a.contacted } : a)),
    );
  }

  function addAgentRow() {
    setAgents((prev) => [...prev, { ...EMPTY_AGENT }]);
  }

  function removeAgentRow(i: number) {
    setAgents((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function toggleFeeItem(item: string) {
    setMaintenanceFeeIncludes((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  function toggleOption(item: string) {
    setOptions((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  function applyExtracted(ex: ExtractedListing): number {
    let filled = 0;
    const apply = (has: boolean, set: () => void) => {
      if (has) {
        set();
        filled++;
      }
    };
    apply(!!ex.title, () => setTitle(ex.title!));
    apply(!!ex.listingNumber, () => setListingNumber(ex.listingNumber!));
    apply(!!ex.platform, () => setPlatform(ex.platform!));
    apply(!!ex.sourceUrl, () => setSourceUrl(ex.sourceUrl!));
    apply(!!ex.buildingType, () => setBuildingType(ex.buildingType!));
    apply(!!ex.dealType, () => setDealType(ex.dealType!));
    apply(ex.deposit != null, () => setDeposit(String(ex.deposit)));
    apply(ex.monthlyRent != null, () => setMonthlyRent(String(ex.monthlyRent)));
    apply(ex.areaSqm != null, () => setAreaSqm(String(ex.areaSqm)));
    apply(ex.rooms != null, () => setRooms(String(ex.rooms)));
    apply(ex.floorNumber != null, () => setFloorNumber(String(ex.floorNumber)));
    apply(!!ex.direction, () => setDirection(ex.direction!));
    apply(ex.totalFloors != null, () => setTotalFloors(String(ex.totalFloors)));
    apply(!!ex.approvalDate, () => setApprovalDate(ex.approvalDate!));
    apply(ex.isViolationBuilding != null, () => setIsViolationBuilding(ex.isViolationBuilding));
    apply(ex.parkingAvailable != null, () => setParkingAvailable(ex.parkingAvailable));
    apply(!!ex.options?.length, () => setOptions(ex.options!));
    apply(ex.maintenanceFee != null, () => setMaintenanceFee(String(ex.maintenanceFee)));
    apply(ex.walkMinutes != null, () => setWalkMinutes(String(ex.walkMinutes)));
    apply(!!ex.nearestStation, () => setNearestStation(ex.nearestStation!));
    apply(!!ex.address, () => setAddress(ex.address!));
    apply(!!ex.agents?.length, () =>
      setAgents(ex.agents!.map((a) => ({ name: a.name ?? "", phone: a.phone ?? "" }))),
    );
    return filled;
  }

  async function handleExtract() {
    if (!captureFile) return;
    setExtracting(true);
    try {
      const ex = await extractListingFromPhoto(captureFile);
      const filled = applyExtracted(ex);

      let addedPhoto = false;
      const box = ex.photoBox;
      if (
        box &&
        box.xmax > box.xmin &&
        box.ymax > box.ymin &&
        box.xmin >= 0 &&
        box.ymax <= 1000 &&
        photos.length < MAX_PHOTOS
      ) {
        try {
          const blob = await cropImageByBox(captureFile, box);
          const file = new File([blob], "capture-photo.jpg", { type: "image/jpeg" });
          setPhotos((prev) => [...prev, { key: createKey(), kind: "new" as const, file }]);
          addedPhoto = true;
        } catch {
          // 사진 추출 실패는 조용히 넘어가고 나머지 정보만 채운 채로 진행
        }
      }

      showToast(
        filled > 0 || addedPhoto
          ? `${filled}개 항목을 채웠어요${addedPhoto ? ", 매물 사진도 1장 추가했어요" : ""}. 확인 후 저장해 주세요`
          : "이미지에서 읽을 수 있는 정보가 없었어요",
      );
      setStep("form");
    } catch {
      showToast("이미지 분석에 실패했어요. 직접 입력해 주세요");
    } finally {
      setExtracting(false);
    }
  }

  async function handleExtractFromUrl() {
    const url = listingUrlInput.trim();
    if (!url) return;
    setExtractingUrl(true);
    try {
      const ex = await extractListingFromUrl(url);
      const filled = applyExtracted(ex);
      showToast(
        filled > 0
          ? `${filled}개 항목을 채웠어요. 확인 후 저장해 주세요`
          : "링크에서 읽을 수 있는 정보가 없었어요",
      );
      setStep("form");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "매물 정보를 읽는 데 실패했어요");
    } finally {
      setExtractingUrl(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function handleFormBack() {
    // capture 단계에서 넘어온 새 매물 작성 중이면, 페이지를 나가는 대신
    // capture 단계로 돌아가서 입력하던 내용을 잃지 않게 한다.
    if (!isEdit) {
      setStep("capture");
    } else {
      navigate(-1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("매물 이름을 입력해 주세요");
      return;
    }
    setSubmitting(true);
    const photoOrder = photos.map((p) => (p.kind === "existing" ? p.id : "__new__"));
    const newPhotos = newFilesInOrder.map((p) => p.file);
    const cleanedAgents = agents
      .map((a) => ({ name: a.name.trim(), phone: a.phone.trim(), contacted: a.contacted }))
      .filter((a) => a.name || a.phone);
    const payload = {
      title: title.trim(),
      listingNumber: listingNumber.trim() || undefined,
      platform: platform.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      buildingType: buildingType.trim() || undefined,
      dealType,
      deposit: Number(deposit) || 0,
      monthlyRent: RENT_TYPES.includes(dealType) ? Number(monthlyRent) || 0 : undefined,
      areaSqm: areaSqm ? Number(areaSqm) : undefined,
      rooms: rooms ? Number(rooms) : undefined,
      floorNumber: floorNumber ? Number(floorNumber) : undefined,
      direction: direction || undefined,
      totalFloors: totalFloors ? Number(totalFloors) : undefined,
      approvalDate: approvalDate.trim() || undefined,
      isViolationBuilding,
      isFakeListing,
      parkingAvailable,
      options,
      maintenanceFee: maintenanceFee ? Number(maintenanceFee) : undefined,
      maintenanceFeeIncludes,
      walkMinutes: walkMinutes ? Number(walkMinutes) : undefined,
      nearestStation: nearestStation.trim() || undefined,
      address: address.trim() || undefined,
      agents: cleanedAgents,
      memo: memo.trim() || undefined,
      status,
      tags,
      newPhotos,
    };

    try {
      if (isEdit && existing) {
        await editListing(existing.id, { ...payload, photoOrder });
        showToast("매물 정보를 수정했어요");
        navigate(`/listing/${existing.id}`);
      } else {
        const created = await createListing(payload);
        showToast("새 매물을 저장했어요");
        navigate(`/listing/${created.id}`);
      }
    } catch {
      showToast("저장에 실패했어요. 다시 시도해 주세요");
    } finally {
      setSubmitting(false);
    }
  }

  if (isEdit && loaded && !existing) {
    return (
      <PageShell>
        <div className="p-6 text-center text-sm font-semibold text-ink-muted">
          매물을 찾을 수 없어요.
        </div>
      </PageShell>
    );
  }

  const cropItem = photos.find((p) => p.key === cropKey);

  if (step === "capture") {
    return (
      <PageShell>
        <div className="pb-10">
          <div className="flex items-center gap-3 px-5 pb-2 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white shadow-sm"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 5 8 12l6.5 7" />
              </svg>
            </button>
            <h1 className="text-[17px] font-bold text-ink">새 매물 저장</h1>
          </div>

          <div className="flex flex-col items-center gap-5 px-5 pt-12 text-center">
            <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-[#E8EEFD]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D3FAF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
              </svg>
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-ink">캡처 이미지로 빠르게 채워보세요</h2>
              <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-ink-light">
                부동산 앱에서 캡처한 매물 정보 화면을 올리면
                <br />
                AI가 매물 이름, 가격, 면적 같은 항목을 자동으로 채워줘요.
              </p>
            </div>

            <div className="w-full max-w-sm">
              {captureFile ? (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCapturePreviewOpen(true)}
                    className="relative h-44 w-full overflow-hidden rounded-2xl border border-line p-0"
                  >
                    <img src={captureUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                  <div className="flex w-full gap-2">
                    <button
                      type="button"
                      onClick={() => setCaptureFile(null)}
                      className="flex-none rounded-xl border border-line bg-white px-4 py-3 text-[12.5px] font-bold text-ink-soft"
                    >
                      다시 선택
                    </button>
                    <button
                      type="button"
                      onClick={handleExtract}
                      disabled={extracting}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-[13px] font-bold text-white disabled:opacity-60"
                    >
                      {extracting ? (
                        "분석 중..."
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
                          </svg>
                          이 사진으로 채우기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-[#F5F8FE] py-12 text-[13px] font-bold text-primary-dark">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1D3FAF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
                  </svg>
                  캡처 이미지 올리기
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setCaptureFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex w-full max-w-sm items-center gap-2.5 text-[11.5px] font-bold text-ink-light">
              <div className="h-px flex-1 bg-line" />
              또는
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="flex w-full max-w-sm gap-2">
              <input
                value={listingUrlInput}
                onChange={(e) => setListingUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleExtractFromUrl();
                  }
                }}
                placeholder="매물 링크 붙여넣기"
                className="w-full min-w-0 flex-1 rounded-2xl border border-line bg-white px-3.5 py-3 text-[13px] font-medium text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extractingUrl || !listingUrlInput.trim()}
                className="flex-none rounded-xl bg-primary px-4 py-3 text-[13px] font-bold text-white disabled:opacity-60"
              >
                {extractingUrl ? "불러오는 중..." : "채우기"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-1 text-[12.5px] font-bold text-ink-light underline underline-offset-2"
            >
              직접 입력할게요
            </button>
          </div>
        </div>

        {capturePreviewOpen && captureUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
            onClick={() => setCapturePreviewOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCapturePreviewOpen(false)}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <img
              src={captureUrl}
              alt="캡처 미리보기"
              className="max-h-full max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="pb-28">
        <div className="flex items-center gap-3 px-5 pb-2 pt-6">
          <button
            type="button"
            onClick={handleFormBack}
            className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white shadow-sm"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-ink">{isEdit ? "매물 정보 수정" : "새 매물 저장"}</h1>
        </div>

        <div className="flex flex-col gap-4 px-5 pt-3">
          <Section label="사진">
            <div className="flex flex-wrap gap-2.5">
              {photos.map((item, i) => {
                const url = previewUrls[i];
                const isPrimary = i === 0;
                return (
                  <div
                    key={item.key}
                    className="relative h-24 w-20 flex-none overflow-hidden rounded-2xl border"
                    style={{ borderColor: isPrimary ? "#2B5BE2" : "rgba(13,27,52,.1)" }}
                  >
                    <button type="button" onClick={() => setPreviewIndex(i)} className="block h-full w-full p-0">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                    {isPrimary && (
                      <span className="absolute left-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                        대표
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(item.key)}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 pt-3">
                      {!isPrimary && (
                        <button
                          type="button"
                          title="대표로 설정"
                          onClick={() => setPrimary(item.key)}
                          className="grid h-5 w-5 place-items-center rounded-full bg-white/90"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#1D3FAF" stroke="#1D3FAF" strokeWidth="1">
                            <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        title="자르기"
                        onClick={() => setCropKey(item.key)}
                        className="grid h-5 w-5 place-items-center rounded-full bg-white/90"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {photos.length < MAX_PHOTOS && (
                <label className="grid h-24 w-20 flex-none cursor-pointer place-items-center rounded-2xl border border-dashed border-primary/40 bg-bg-soft text-2xl font-bold text-primary">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-1.5 text-[11.5px] font-medium text-ink-light">
              직접 찍은 사진을 올려두면 나중에 비교하기 편해요 (최대 {MAX_PHOTOS}장).
              별 아이콘으로 대표사진을, 자르기 아이콘으로 원하는 부분만 남길 수 있어요.
            </p>
            {photos.length < MAX_PHOTOS && (
              <div className="mt-2.5 flex gap-2">
                <input
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPhotoUrl();
                    }
                  }}
                  placeholder="이미지 URL 붙여넣기"
                  className="w-full min-w-0 flex-1 rounded-2xl border border-line bg-white px-3.5 py-3 text-[13px] font-medium text-ink outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  disabled={addingPhotoFromUrl || !photoUrlInput.trim()}
                  className="flex-none rounded-2xl bg-chip px-4 py-3 text-[12.5px] font-bold text-ink-soft disabled:opacity-50"
                >
                  {addingPhotoFromUrl ? "불러오는 중..." : "추가"}
                </button>
              </div>
            )}
          </Section>

          <Section label="매물 이름">
            <TextInput value={title} onChange={setTitle} placeholder="예: 상동 두산위브, 역곡동 신동아 빌라" />
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label="매물번호">
              <TextInput value={listingNumber} onChange={setListingNumber} placeholder="예: 252875034" />
            </Section>
            <Section label="플랫폼">
              <TextInput value={platform} onChange={setPlatform} placeholder="예: 네이버부동산" />
            </Section>
          </div>
          <div className="-mt-2.5 flex flex-wrap gap-1.5">
            {PLATFORM_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className="rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
                style={{
                  background: platform === p ? "#E8EEFD" : "#fff",
                  color: platform === p ? "#1D3FAF" : "#5B6B8C",
                  border: `1px solid ${platform === p ? "#2B5BE2" : "rgba(13,27,52,.1)"}`,
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <Section label="매물 링크">
            <TextInput value={sourceUrl} onChange={setSourceUrl} placeholder="https://..." />
          </Section>

          <Section label="거래 유형">
            <div className="flex gap-2">
              {DEAL_TYPES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDealType(d)}
                  className="flex-1 rounded-xl border py-2.5 text-[13px] font-bold"
                  style={{
                    borderColor: dealType === d ? "#2B5BE2" : "rgba(13,27,52,.1)",
                    background: dealType === d ? "#E8EEFD" : "#fff",
                    color: dealType === d ? "#1D3FAF" : "#5B6B8C",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label={depositLabel(dealType)}>
              <TextInput value={deposit} onChange={setDeposit} placeholder="예: 3000" type="number" />
            </Section>
            {RENT_TYPES.includes(dealType) && (
              <Section label="월세 (만원)">
                <TextInput value={monthlyRent} onChange={setMonthlyRent} placeholder="예: 55" type="number" />
              </Section>
            )}
            <Section label="관리비 (만원)">
              <TextInput value={maintenanceFee} onChange={setMaintenanceFee} placeholder="예: 8" type="number" />
            </Section>
          </div>

          <Section label="관리비 포함 항목">
            <div className="flex flex-wrap gap-1.5">
              {MAINTENANCE_FEE_ITEMS.map((item) => {
                const active = maintenanceFeeIncludes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFeeItem(item)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold"
                    style={{
                      background: active ? "#E2F6EF" : "#fff",
                      color: active ? "#0B7355" : "#5B6B8C",
                      border: `1px solid ${active ? "#0B7355" : "rgba(13,27,52,.1)"}`,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label="전용 면적 (㎡)">
              <TextInput value={areaSqm} onChange={setAreaSqm} placeholder="예: 26.4" type="number" />
              {pyeongPreview != null && (
                <p className="mt-1 text-[11px] font-semibold text-primary-dark">≈ {pyeongPreview}평</p>
              )}
            </Section>
            <Section label="방 개수">
              <TextInput value={rooms} onChange={setRooms} placeholder="예: 2" type="number" />
            </Section>
            <Section label="층수">
              <TextInput value={floorNumber} onChange={setFloorNumber} placeholder="예: 3 (반지하는 0)" type="number" />
            </Section>
            <Section label="건물 총 층수">
              <TextInput value={totalFloors} onChange={setTotalFloors} placeholder="예: 5" type="number" />
            </Section>
          </div>

          <Section label="방향">
            <div className="flex flex-wrap gap-1.5">
              {DIRECTION_PRESETS.map((d) => {
                const active = direction === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(active ? "" : d)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold"
                    style={{
                      background: active ? "#E8EEFD" : "#fff",
                      color: active ? "#1D3FAF" : "#5B6B8C",
                      border: `1px solid ${active ? "#2B5BE2" : "rgba(13,27,52,.1)"}`,
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="건축물 용도">
            <TextInput value={buildingType} onChange={setBuildingType} placeholder="예: 다세대주택(빌라)" />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {BUILDING_TYPE_PRESETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBuildingType(b)}
                  className="rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
                  style={{
                    background: buildingType === b ? "#E8EEFD" : "#fff",
                    color: buildingType === b ? "#1D3FAF" : "#5B6B8C",
                    border: `1px solid ${buildingType === b ? "#2B5BE2" : "rgba(13,27,52,.1)"}`,
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </Section>

          <Section label="사용승인일">
            <TextInput value={approvalDate} onChange={setApprovalDate} placeholder="예: 2010-05" />
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label="위반건축물 여부">
              <YesNoToggle value={isViolationBuilding} onChange={setIsViolationBuilding} />
            </Section>
            <Section label="주차 가능 여부">
              <YesNoToggle value={parkingAvailable} onChange={setParkingAvailable} />
            </Section>
            <Section label="허위매물 의심 여부">
              <YesNoToggle value={isFakeListing} onChange={setIsFakeListing} />
            </Section>
          </div>

          <Section label="옵션 / 풀옵션">
            <div className="flex flex-wrap gap-1.5">
              {OPTION_ITEMS.map((item) => {
                const active = options.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleOption(item)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold"
                    style={{
                      background: active ? "#E2F6EF" : "#fff",
                      color: active ? "#0B7355" : "#5B6B8C",
                      border: `1px solid ${active ? "#0B7355" : "rgba(13,27,52,.1)"}`,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label="가까운 지하철역">
              <TextInput value={nearestStation} onChange={setNearestStation} placeholder="예: 2호선 강남역" />
            </Section>
            <Section label="역까지 도보 (분)">
              <TextInput value={walkMinutes} onChange={setWalkMinutes} placeholder="예: 8" type="number" />
            </Section>
          </div>

          <Section label="주소">
            <TextInput value={address} onChange={setAddress} placeholder="예: 경기 부천시 원미로 55" />
          </Section>

          <Section label="중개사무소 / 담당자">
            <div className="flex flex-col gap-2">
              {agents.map((agent, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-2.5">
                  <div className="flex gap-2">
                    <TextInput
                      value={agent.name}
                      onChange={(v) => updateAgent(i, "name", v)}
                      placeholder="예: 원미공인중개사 이수진"
                    />
                    <TextInput
                      value={agent.phone}
                      onChange={(v) => updateAgent(i, "phone", v)}
                      placeholder="010-0000-0000"
                    />
                    <button
                      type="button"
                      onClick={() => removeAgentRow(i)}
                      disabled={agents.length <= 1}
                      className="flex-none rounded-xl border border-line bg-white px-3 text-ink-light disabled:opacity-40"
                    >
                      ×
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAgentContacted(i)}
                    className="self-start rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
                    style={{
                      background: agent.contacted ? "#E8EEFD" : "#F5F6FA",
                      color: agent.contacted ? "#1D3FAF" : "#8392AE",
                      border: `1px solid ${agent.contacted ? "#2B5BE2" : "rgba(13,27,52,.1)"}`,
                    }}
                  >
                    {agent.contacted ? "✓ 연락한 담당자" : "연락한 담당자로 표시"}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAgentRow}
                className="self-start text-[12.5px] font-bold text-primary"
              >
                + 담당자 추가
              </button>
            </div>
          </Section>

          <Section label="상태">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => {
                const active = status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className="rounded-xl border px-3 py-2 text-[12px] font-bold"
                    style={{
                      borderColor: active ? s.ink : "rgba(13,27,52,.1)",
                      background: active ? s.bg : "#fff",
                      color: active ? s.ink : "#5B6B8C",
                    }}
                  >
                    {s.value}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="태그">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-2.5">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-lg bg-chip px-2.5 py-1 text-[12px] font-bold text-ink-soft">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="text-ink-light">
                    ×
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="입력 후 Enter"
                className="min-w-[100px] flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-ink-light"
              />
            </div>
          </Section>

          <Section label="메모">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="현장에서 느낀 점, 확인할 사항 등을 적어두세요"
              className="w-full resize-none rounded-2xl border border-line bg-white p-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-primary"
            />
          </Section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-line bg-bg-screen/95 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="w-full max-w-md">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-primary py-4 text-[14.5px] font-bold text-white shadow-cta disabled:opacity-60"
            >
              {submitting ? "저장 중..." : isEdit ? "수정 내용 저장" : "이 매물 저장하기"}
            </button>
          </div>
        </div>
      </form>

      {previewIndex != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewIndex(null)}
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {previewUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((i) => (i! - 1 + previewUrls.length) % previewUrls.length);
                }}
                className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 5 8 12l6.5 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((i) => (i! + 1) % previewUrls.length);
                }}
                className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9.5 5 6.5 7-6.5 7" />
                </svg>
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-white/15 px-2.5 py-1 text-[12px] font-bold text-white">
                {previewIndex + 1} / {previewUrls.length}
              </span>
            </>
          )}
          <img
            src={previewUrls[previewIndex]}
            alt="미리보기"
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {cropItem && (
        <ImageCropModal
          src={displayUrl(cropItem)}
          onCancel={() => setCropKey(null)}
          onConfirm={(blob) => replaceWithCropped(cropItem.key, blob)}
        />
      )}
    </PageShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { label: "예", v: true },
        { label: "아니오", v: false },
      ].map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(active ? undefined : opt.v)}
            className="flex-1 rounded-xl border py-2.5 text-[13px] font-bold"
            style={{
              borderColor: active ? "#2B5BE2" : "rgba(13,27,52,.1)",
              background: active ? "#E8EEFD" : "#fff",
              color: active ? "#1D3FAF" : "#5B6B8C",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={type === "number" ? "numeric" : undefined}
      className="w-full min-w-0 rounded-2xl border border-line bg-white px-3.5 py-3 text-[13.5px] font-medium text-ink outline-none focus:border-primary"
    />
  );
}
