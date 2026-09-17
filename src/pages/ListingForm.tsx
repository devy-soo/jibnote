import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useListingStore } from "../store/useListingStore";
import { useToast } from "../components/ToastProvider";
import { useObjectUrls } from "../lib/useObjectUrls";
import { resolveUploadUrl } from "../api/client";
import { extractListingFromPhoto } from "../api/extract";
import { STATUS_OPTIONS } from "../constants/statuses";
import type { DealType, ListingStatus, Photo } from "../types";

const DEAL_TYPES: DealType[] = ["전세", "월세"];
const MAX_PHOTOS = 8;

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
  const [dealType, setDealType] = useState<DealType>("월세");
  const [deposit, setDeposit] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [maintenanceFee, setMaintenanceFee] = useState("");
  const [walkMinutes, setWalkMinutes] = useState("");
  const [address, setAddress] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState<ListingStatus>("관심");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && existing && !hydrated) {
      setTitle(existing.title);
      setDealType(existing.dealType);
      setDeposit(existing.deposit ? String(existing.deposit) : "");
      setMonthlyRent(existing.monthlyRent ? String(existing.monthlyRent) : "");
      setArea(existing.area ?? "");
      setFloor(existing.floor ?? "");
      setMaintenanceFee(existing.maintenanceFee ? String(existing.maintenanceFee) : "");
      setWalkMinutes(existing.walkMinutes ? String(existing.walkMinutes) : "");
      setAddress(existing.address ?? "");
      setAgentName(existing.agentName ?? "");
      setAgentPhone(existing.agentPhone ?? "");
      setMemo(existing.memo ?? "");
      setStatus(existing.status);
      setTags(existing.tags);
      setExistingPhotos(existing.photos);
      setHydrated(true);
    }
  }, [isEdit, existing, hydrated]);

  const newFileUrls = useObjectUrls(newFiles);
  const totalPhotoCount = existingPhotos.length + newFiles.length;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).slice(0, Math.max(0, MAX_PHOTOS - totalPhotoCount));
    setNewFiles((prev) => [...prev, ...next]);
  }

  function removeExistingPhoto(photoId: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  function removeNewFile(i: number) {
    setNewFiles((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleExtract() {
    const target = newFiles[newFiles.length - 1];
    if (!target) return;
    setExtracting(true);
    try {
      const ex = await extractListingFromPhoto(target);
      let filled = 0;
      const apply = (has: boolean, set: () => void) => {
        if (has) {
          set();
          filled++;
        }
      };
      apply(!!ex.title, () => setTitle(ex.title!));
      apply(!!ex.dealType, () => setDealType(ex.dealType!));
      apply(ex.deposit != null, () => setDeposit(String(ex.deposit)));
      apply(ex.monthlyRent != null, () => setMonthlyRent(String(ex.monthlyRent)));
      apply(!!ex.area, () => setArea(ex.area!));
      apply(!!ex.floor, () => setFloor(ex.floor!));
      apply(ex.maintenanceFee != null, () => setMaintenanceFee(String(ex.maintenanceFee)));
      apply(ex.walkMinutes != null, () => setWalkMinutes(String(ex.walkMinutes)));
      apply(!!ex.address, () => setAddress(ex.address!));
      apply(!!ex.agentName, () => setAgentName(ex.agentName!));
      apply(!!ex.agentPhone, () => setAgentPhone(ex.agentPhone!));

      showToast(
        filled > 0
          ? `${filled}개 항목을 채웠어요. 확인 후 저장해 주세요`
          : "이미지에서 읽을 수 있는 정보가 없었어요",
      );
    } catch {
      showToast("이미지 분석에 실패했어요. 직접 입력해 주세요");
    } finally {
      setExtracting(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("매물 이름을 입력해 주세요");
      return;
    }
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      dealType,
      deposit: Number(deposit) || 0,
      monthlyRent: dealType === "월세" ? Number(monthlyRent) || 0 : undefined,
      area: area.trim() || undefined,
      floor: floor.trim() || undefined,
      maintenanceFee: maintenanceFee ? Number(maintenanceFee) : undefined,
      walkMinutes: walkMinutes ? Number(walkMinutes) : undefined,
      address: address.trim() || undefined,
      agentName: agentName.trim() || undefined,
      agentPhone: agentPhone.trim() || undefined,
      memo: memo.trim() || undefined,
      status,
      tags,
      newPhotos: newFiles,
    };

    try {
      if (isEdit && existing) {
        await editListing(existing.id, {
          ...payload,
          keepPhotoIds: existingPhotos.map((p) => p.id),
        });
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

  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="pb-28">
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
          <h1 className="text-[17px] font-bold text-ink">{isEdit ? "매물 정보 수정" : "새 매물 저장"}</h1>
        </div>

        <div className="flex flex-col gap-4 px-5 pt-3">
          <Section label="사진">
            <div className="flex flex-wrap gap-2.5">
              {existingPhotos.map((photo) => {
                const url = resolveUploadUrl(photo.url);
                return (
                  <div key={photo.id} className="relative h-24 w-20 flex-none overflow-hidden rounded-2xl border border-line">
                    <button type="button" onClick={() => setPreviewUrl(url)} className="block h-full w-full p-0">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              {newFileUrls.map((url, i) => (
                <div key={url} className="relative h-24 w-20 flex-none overflow-hidden rounded-2xl border border-line">
                  <button type="button" onClick={() => setPreviewUrl(url)} className="block h-full w-full p-0">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
              {totalPhotoCount < MAX_PHOTOS && (
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
              매물 캡처 화면이나 직접 찍은 사진을 올려두면 나중에 비교하기 편해요 (최대 {MAX_PHOTOS}장)
            </p>
            {newFiles.length > 0 && (
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-[#E8EEFD] py-2.5 text-[12.5px] font-bold text-primary-dark disabled:opacity-60"
              >
                {extracting ? (
                  "이미지 분석 중..."
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D3FAF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
                    </svg>
                    방금 올린 사진에서 AI로 채우기
                  </>
                )}
              </button>
            )}
          </Section>

          <Section label="매물 이름">
            <TextInput value={title} onChange={setTitle} placeholder="예: 상동 두산위브, 역곡동 신동아 빌라" />
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

          <Section label={dealType === "월세" ? "보증금 (만원)" : "전세금 (만원)"}>
            <TextInput value={deposit} onChange={setDeposit} placeholder="예: 3000" type="number" />
          </Section>

          {dealType === "월세" && (
            <Section label="월세 (만원)">
              <TextInput value={monthlyRent} onChange={setMonthlyRent} placeholder="예: 55" type="number" />
            </Section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Section label="전용 면적">
              <TextInput value={area} onChange={setArea} placeholder="예: 26.4㎡ (8평)" />
            </Section>
            <Section label="층 / 방향">
              <TextInput value={floor} onChange={setFloor} placeholder="예: 3층 / 남향" />
            </Section>
            <Section label="관리비 (만원)">
              <TextInput value={maintenanceFee} onChange={setMaintenanceFee} placeholder="예: 8" type="number" />
            </Section>
            <Section label="역까지 도보 (분)">
              <TextInput value={walkMinutes} onChange={setWalkMinutes} placeholder="예: 8" type="number" />
            </Section>
          </div>

          <Section label="주소">
            <TextInput value={address} onChange={setAddress} placeholder="예: 경기 부천시 원미로 55" />
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section label="중개사무소 / 담당자">
              <TextInput value={agentName} onChange={setAgentName} placeholder="예: 원미공인중개사 이수진" />
            </Section>
            <Section label="중개사 연락처">
              <TextInput value={agentPhone} onChange={setAgentPhone} placeholder="010-0000-0000" />
            </Section>
          </div>

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

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <img
            src={previewUrl}
            alt="미리보기"
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
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
      className="w-full rounded-2xl border border-line bg-white px-3.5 py-3 text-[13.5px] font-medium text-ink outline-none focus:border-primary"
    />
  );
}
