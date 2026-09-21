import { api } from "./client";

function extFromMime(mime: string): string {
  const sub = mime.split("/")[1]?.split("+")[0];
  return sub || "jpg";
}

async function blobErrorMessage(blob: unknown, fallback: string): Promise<string> {
  if (!(blob instanceof Blob)) return fallback;
  try {
    const parsed = JSON.parse(await blob.text());
    return typeof parsed.error === "string" ? parsed.error : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchPhotoFromUrl(url: string): Promise<File> {
  try {
    const res = await api.post(
      "/listings/photo-from-url",
      { url },
      { responseType: "blob" },
    );
    const blob = res.data as Blob;
    return new File([blob], `url-photo.${extFromMime(blob.type)}`, { type: blob.type });
  } catch (err) {
    const fallback = "이미지를 불러오지 못했어요";
    if (err && typeof err === "object" && "response" in err) {
      const response = (err as { response?: { data?: unknown } }).response;
      throw new Error(await blobErrorMessage(response?.data, fallback));
    }
    throw new Error(fallback);
  }
}
