import type { PixelCrop } from "react-image-crop";

/** box 좌표는 이미지 전체를 1000으로 본 정규화 값 (xmin, ymin, xmax, ymax). */
export function cropImageByBox(
  file: File,
  box: { xmin: number; ymin: number; xmax: number; ymax: number },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scaleX = image.naturalWidth / 1000;
      const scaleY = image.naturalHeight / 1000;
      const x = box.xmin * scaleX;
      const y = box.ymin * scaleY;
      const width = (box.xmax - box.xmin) * scaleX;
      const height = (box.ymax - box.ymin) * scaleY;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas context 생성 실패"));
        return;
      }
      ctx.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("이미지 자르기 실패"))),
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했어요"));
    };
    image.src = url;
  });
}

export function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width * scaleX));
  canvas.height = Math.max(1, Math.round(crop.height * scaleY));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas context 생성 실패"));

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 자르기 실패"))),
      "image/jpeg",
      0.92,
    );
  });
}
