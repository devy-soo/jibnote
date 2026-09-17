import { useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import { getCroppedBlob } from "../lib/cropImage";

interface ImageCropModalProps {
  src: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export function ImageCropModal({ src, onCancel, onConfirm }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, width / height, width, height),
      width,
      height,
    );
    setCrop(initial);
  }

  async function handleConfirm() {
    if (!imgRef.current || !pixelCrop || pixelCrop.width < 1 || pixelCrop.height < 1) {
      onCancel();
      return;
    }
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, pixelCrop);
      onConfirm(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-5 py-4">
        <button type="button" onClick={onCancel} className="text-[13px] font-bold text-white/80">
          취소
        </button>
        <span className="text-[13px] font-bold text-white">사진 자르기</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="text-[13px] font-bold text-primary disabled:opacity-50"
        >
          {saving ? "적용 중..." : "적용"}
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setPixelCrop(c)}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img ref={imgRef} src={src} onLoad={onImageLoad} style={{ maxHeight: "70vh" }} />
        </ReactCrop>
      </div>
    </div>
  );
}
