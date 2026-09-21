import { api } from "./client";
import type { DealType } from "../types";

export interface ExtractedAgent {
  name?: string;
  phone?: string;
}

export interface ExtractedListing {
  title?: string;
  listingNumber?: string;
  platform?: string;
  sourceUrl?: string;
  buildingType?: string;
  dealType?: DealType;
  deposit?: number;
  monthlyRent?: number;
  areaSqm?: number;
  rooms?: number;
  floorNumber?: number;
  direction?: string;
  totalFloors?: number;
  approvalDate?: string;
  isViolationBuilding?: boolean;
  parkingAvailable?: boolean;
  options?: string[];
  maintenanceFee?: number;
  walkMinutes?: number;
  nearestStation?: string;
  address?: string;
  agents?: ExtractedAgent[];
  photoBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
}

export async function extractListingFromPhoto(file: File): Promise<ExtractedListing> {
  const fd = new FormData();
  fd.append("photo", file);
  const res = await api.post("/listings/extract", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.extracted as ExtractedListing;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "error" in err.response.data &&
    typeof err.response.data.error === "string"
  ) {
    return err.response.data.error;
  }
  return fallback;
}

export async function extractListingFromUrl(url: string): Promise<ExtractedListing> {
  try {
    const res = await api.post("/listings/extract-url", { url });
    return res.data.extracted as ExtractedListing;
  } catch (err) {
    throw new Error(extractErrorMessage(err, "매물 정보를 읽는 데 실패했어요."));
  }
}
